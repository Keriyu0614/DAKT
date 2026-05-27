import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authApi from '../../api/auth.api';
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

export const RegisterPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    // State
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 0 // Default to Elderly
    });
    const [error, setError] = useState('');
    const [emailExists, setEmailExists] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'role' ? parseInt(value) : value
        }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
            setError('Vui lòng điền đầy đủ các trường.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu không khớp.');
            return;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,}$/;
        if (!passwordRegex.test(formData.password)) {
            setError('Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, số và ký tự đặc biệt.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setEmailExists(false);

            await authApi.register({
                name: formData.fullName,
                email: formData.email,
                password: formData.password,
                role: formData.role
            });

            if (formData.role === 0) {
                setSuccessMessage("Bạn đã đăng ký tài khoản người cao tuổi thành công, bây giờ bạn có thể thực hiện quản lý tài khoản này với tài khoản người chăm sóc của bạn.");
            } else {
                alert('Tạo tài khoản thành công! Vui lòng đăng nhập.');
                navigate('/login');
            }
        } catch (err: any) {
            console.error(err);
            const message = err?.response?.data?.message || '';
            if (message === 'User already exists') {
                setEmailExists(true);
            } else {
                setError(message || 'Đăng ký thất bại. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        navigate('/login');
    };

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) return;

        try {
            setLoading(true);
            const response = await authApi.googleLogin(credentialResponse.credential);
            const data = response.data;

            // Chặn Elderly login Web
            if (data.role === "Elderly" || data.role === "0" || data.role === 0 as any) {
                setError("Tài khoản người cao tuổi chỉ có thể đăng nhập trên ứng dụng điện thoại.");
                return;
            }

            login(data, true);
            navigate("/app");
            toast.success("Đăng nhập bằng Google thành công!");
        } catch (err: any) {
            console.error(err);
            toast.error("Đăng nhập bằng Google thất bại");
        } finally {
            setLoading(false);
        }
    };

    if (successMessage) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h1 style={styles.title}>Đăng ký thành công</h1>
                    <p style={styles.subtitle}>{successMessage}</p>
                    <button onClick={handleBackToLogin} style={styles.registerButton}>
                        Quay về trang đăng nhập
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <img src="/CareLink.png" alt="CareLink" style={styles.logo} />
                <h1 style={styles.title}>Tạo Tài Khoản</h1>
                <p style={styles.subtitle}>Đăng ký tài khoản mới để bắt đầu sử dụng hệ thống</p>

                {error && <div style={styles.errorBox}>{error}</div>}

                {emailExists && (
                    <div style={styles.emailExistsBox}>
                        <span>Email này đã được đăng ký. </span>
                        <button onClick={handleBackToLogin} style={styles.loginSuggestionLink}>
                            Đăng nhập ngay?
                        </button>
                    </div>
                )}

                <form onSubmit={handleRegister} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Đăng ký với vai trò</label>
                        <select
                            id="role"
                            style={styles.select}
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value={0}>Người cao tuổi</option>
                            <option value={1}>Người chăm sóc</option>
                        </select>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Họ và Tên</label>
                        <input
                            id="fullName"
                            style={styles.input}
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Ví dụ: Nguyễn Văn A"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Địa chỉ Email</label>
                        <input
                            id="email"
                            style={styles.input}
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Ví dụ: email@example.com"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Mật khẩu</label>
                        <input
                            id="password"
                            style={styles.input}
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Tạo mật khẩu"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Xác nhận Mật khẩu</label>
                        <input
                            id="confirmPassword"
                            style={styles.input}
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Xác nhận mật khẩu của bạn"
                        />
                    </div>

                    <button type="submit" style={styles.registerButton} disabled={loading}>
                        {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
                    </button>
                </form>

                <div style={styles.divider}>
                    <span style={styles.dividerLine}></span>
                    <span style={styles.dividerText}>HOẶC</span>
                    <span style={styles.dividerLine}></span>
                </div>

                <div style={styles.googleWrapper}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => toast.error("Đăng nhập Google thất bại")}
                        theme="outline"
                        shape="pill"
                    />
                </div>

                <div style={styles.footer}>
                    <button onClick={handleBackToLogin} style={styles.linkButton}>
                        Quay lại Đăng nhập
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Styles (Elderly Friendly) ---
const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f0f4f8',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        fontFamily: 'sans-serif',
    },
    card: {
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '500px',
        textAlign: 'center',
    },
    logo: {
        height: '72px',
        width: 'auto',
        objectFit: 'contain' as const,
        marginBottom: '12px',
    },
    title: {
        fontSize: '36px',
        color: '#2c3e50',
        marginBottom: '10px',
    },
    subtitle: {
        fontSize: '18px',
        color: '#7f8c8d',
        marginBottom: '30px',
        lineHeight: '1.4',
    },
    errorBox: {
        backgroundColor: '#ffdddd',
        color: '#c0392b',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '16px',
        border: '1px solid #e74c3c',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        gap: '8px',
    },
    label: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#34495e',
    },
    input: {
        padding: '15px',
        fontSize: '18px',
        borderRadius: '8px',
        border: '1px solid #bdc3c7',
        outline: 'none',
    },
    select: {
        padding: '15px',
        fontSize: '18px',
        borderRadius: '8px',
        border: '1px solid #bdc3c7',
        outline: 'none',
        backgroundColor: 'white',
        cursor: 'pointer',
    },
    registerButton: {
        marginTop: '10px',
        padding: '18px',
        fontSize: '20px',
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: '#2980B9', // Green for register
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    footer: {
        marginTop: '25px',
        borderTop: '1px solid #eee',
        paddingTop: '20px',
    },
    linkButton: {
        background: 'none',
        border: 'none',
        color: '#7f8c8d',
        fontSize: '18px',
        fontWeight: 'bold',
        cursor: 'pointer',
        textDecoration: 'underline',
    },
    divider: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "20px 0",
        gap: "10px",
    },
    dividerLine: {
        flex: 1,
        height: "1px",
        backgroundColor: "#eee",
    },
    dividerText: {
        color: "#999",
        fontSize: "14px",
        fontWeight: "bold",
    },
    googleWrapper: {
        display: "flex",
        justifyContent: "center",
        marginTop: "10px",
    },
    emailExistsBox: {
        backgroundColor: '#fff3cd',
        color: '#856404',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '16px',
        border: '1px solid #ffc107',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        flexWrap: 'wrap' as const,
        justifyContent: 'center',
    },
    loginSuggestionLink: {
        background: 'none',
        border: 'none',
        color: '#2980B9',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        textDecoration: 'underline',
        padding: 0,
    },
};
