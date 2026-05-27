import React, { useState } from 'react';
import { X } from 'lucide-react';
import authApi from '../../api/auth.api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

interface AddElderlyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddElderlyModal: React.FC<AddElderlyModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;

        try {
            setLoading(true);
            await authApi.linkElderly({
                email,
                caregiverId: user.id
            });
            toast.success('Liên kết tài khoản thành công!');
            onSuccess();
            onClose();
            // Clear form
            setEmail('');
        } catch (err: any) {
            console.error(err);
            const msg = err?.response?.data?.message || 'Không thể liên kết tài khoản';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2>Liên kết tài khoản người cao tuổi</h2>
                    <button onClick={onClose} style={styles.closeBtn}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label>Email tài khoản cần liên kết</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="example@gmail.com"
                        />
                    </div>

                    <div style={styles.actions}>
                        <button type="button" onClick={onClose} style={styles.cancelBtn}>
                            Hủy
                        </button>
                        <button type="submit" disabled={loading} style={styles.submitBtn}>
                            {loading ? 'Đang liên kết...' : 'Liên kết'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '500px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#666',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '12px',
    },
    cancelBtn: {
        padding: '10px 20px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        backgroundColor: '#fff',
        cursor: 'pointer',
    },
    submitBtn: {
        padding: '10px 20px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: '#2563EB',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer',
    }
};

export default AddElderlyModal;
