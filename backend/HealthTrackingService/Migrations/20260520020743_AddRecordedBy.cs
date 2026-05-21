using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HealthTrackingService.Migrations
{
    /// <inheritdoc />
    public partial class AddRecordedBy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RecordedBy",
                table: "HealthLogs",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RecordedBy",
                table: "HealthLogs");
        }
    }
}
