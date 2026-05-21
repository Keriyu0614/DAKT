import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

export const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    // State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Handlers
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError("Vui lòng nhập cả email và mật khẩu.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await authApi.login({
                email,
                password,
            });

            const data = response.data;

            // ✅ MAP ĐÚNG CẤU TRÚC AuthContext CẦN
            login(data);

            navigate("/app");
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };


    const handleGoToRegister = () => {
        navigate("/register");
    };

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) return;

        try {
            setLoading(true);
            const response = await authApi.googleLogin(credentialResponse.credential);
            login(response.data);
            navigate("/app");
            toast.success("Đăng nhập bằng Google thành công!");
        } catch (err: any) {
            console.error(err);
            toast.error("Đăng nhập bằng Google thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Đăng nhập</h1>
                <p style={styles.subtitle}>
                    Đăng nhập để quản lý thông tin thuốc và sức khỏe của bạn
                </p>


                {error && <div style={styles.errorBox}>{error}</div>}

                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Địa chỉ Email</label>
                        <input
                            style={styles.input}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Nhập email của bạn"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Mật khẩu</label>
                        <input
                            style={styles.input}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nhập mật khẩu của bạn"
                        />
                    </div>

                    <button type="submit" style={styles.loginButton} disabled={loading}>
                        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
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
                        useOneTap
                        theme="filled_blue"
                        shape="pill"
                        width="100%"
                    />
                </div>

                <div style={styles.footer}>
                    <p style={styles.footerText}>Bạn chưa có tài khoản?</p>
                    <button onClick={handleGoToRegister} style={styles.linkButton}>
                        Tạo tài khoản mới
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Styles (UNCHANGED) ---
const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#f0f4f8",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        fontFamily: "sans-serif",
    },
    card: {
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "500px",
        textAlign: "center",
    },
    title: {
        fontSize: "36px",
        color: "#2c3e50",
        marginBottom: "10px",
    },
    subtitle: {
        fontSize: "18px",
        color: "#7f8c8d",
        marginBottom: "30px",
        lineHeight: "1.4",
    },
    errorBox: {
        backgroundColor: "#ffdddd",
        color: "#c0392b",
        padding: "15px",
        borderRadius: "8px",
        marginBottom: "20px",
        fontSize: "16px",
        border: "1px solid #e74c3c",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
        gap: "8px",
    },
    label: {
        fontSize: "18px",
        fontWeight: "bold",
        color: "#34495e",
    },
    input: {
        padding: "15px",
        fontSize: "18px",
        borderRadius: "8px",
        border: "1px solid #bdc3c7",
        outline: "none",
    },
    loginButton: {
        marginTop: "10px",
        padding: "18px",
        fontSize: "20px",
        fontWeight: "bold",
        color: "white",
        backgroundColor: "#2980b9",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
    },
    footer: {
        marginTop: "30px",
        borderTop: "1px solid #eee",
        paddingTop: "20px",
    },
    footerText: {
        fontSize: "18px",
        color: "#555",
        marginBottom: "10px",
    },
    linkButton: {
        background: "none",
        border: "none",
        color: "#2980B9",
        fontSize: "18px",
        fontWeight: "bold",
        cursor: "pointer",
        textDecoration: "underline",
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
};
