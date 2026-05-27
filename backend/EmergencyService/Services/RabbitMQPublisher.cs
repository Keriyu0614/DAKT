using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using EmergencyService.Models;

namespace EmergencyService.Services;

/// <summary>
/// RabbitMQ publisher với lazy connect — không crash khi RabbitMQ chưa sẵn sàng lúc startup.
/// Tự reconnect khi publish nếu connection bị mất.
/// </summary>
public class RabbitMQPublisher : IDisposable
{
    private IConnection? _connection;
    private IModel? _channel;
    private const string ExchangeName = "emergency.fanout";
    private readonly ILogger<RabbitMQPublisher> _logger;
    private readonly IConfiguration _config;
    private readonly object _lock = new();

    public RabbitMQPublisher(IConfiguration config, ILogger<RabbitMQPublisher> logger)
    {
        _config = config;
        _logger = logger;
        // Lazy — không connect ngay trong constructor
        _logger.LogInformation("RabbitMQPublisher created (lazy connect mode).");
    }

    private bool EnsureConnected()
    {
        lock (_lock)
        {
            if (_connection != null && _connection.IsOpen &&
                _channel != null && _channel.IsOpen)
                return true;

            try
            {
                _channel?.Dispose();
                _connection?.Dispose();

                var factory = new ConnectionFactory
                {
                    HostName = _config["RabbitMQ:Host"] ?? "localhost",
                    Port = int.Parse(_config["RabbitMQ:Port"] ?? "5672"),
                    UserName = _config["RabbitMQ:Username"] ?? "guest",
                    Password = _config["RabbitMQ:Password"] ?? "guest",
                    RequestedConnectionTimeout = TimeSpan.FromSeconds(5),
                    SocketReadTimeout = TimeSpan.FromSeconds(5),
                    SocketWriteTimeout = TimeSpan.FromSeconds(5),
                };

                _connection = factory.CreateConnection();
                _channel = _connection.CreateModel();

                _channel.ExchangeDeclare(
                    exchange: ExchangeName,
                    type: ExchangeType.Fanout,
                    durable: true,
                    autoDelete: false
                );

                _logger.LogInformation("RabbitMQ connected. Exchange '{Exchange}' ready.", ExchangeName);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "RabbitMQ connection failed: {Message}", ex.Message);
                _channel = null;
                _connection = null;
                return false;
            }
        }
    }

    public void PublishEmergencyEvent(EmergencyEvent emergencyEvent)
    {
        if (!EnsureConnected())
        {
            _logger.LogWarning(
                "RabbitMQ unavailable — emergency event {EventId} NOT published. " +
                "Make sure RabbitMQ is running on {Host}:{Port}",
                emergencyEvent.EventId,
                _config["RabbitMQ:Host"] ?? "localhost",
                _config["RabbitMQ:Port"] ?? "5672");
            // Không throw — trả về bình thường để API vẫn trả 202
            return;
        }

        try
        {
            var json = JsonSerializer.Serialize(emergencyEvent);
            var body = Encoding.UTF8.GetBytes(json);

            var props = _channel!.CreateBasicProperties();
            props.Persistent = true;
            props.ContentType = "application/json";

            _channel.BasicPublish(
                exchange: ExchangeName,
                routingKey: string.Empty,
                basicProperties: props,
                body: body
            );

            _logger.LogInformation(
                "Published emergency event {EventId} for elderly {ElderlyUserId}",
                emergencyEvent.EventId, emergencyEvent.ElderlyUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish emergency event {EventId}", emergencyEvent.EventId);
            // Reset connection để lần sau reconnect
            lock (_lock)
            {
                _channel = null;
                _connection = null;
            }
        }
    }

    public void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
    }
}
