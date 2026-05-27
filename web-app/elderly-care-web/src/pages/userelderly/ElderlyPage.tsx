import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, UserPlus, MoreVertical, ShieldCheck, Plus, PlayCircle } from "lucide-react";
import authApi from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import AddElderlyModal from "./AddElderlyModal";
import "./ElderlyPage.css";

interface ManagedElderly {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatarLetter?: string;
    status?: 'connected' | 'pending';
}

export const ElderlyPage = () => {
    const { t } = useTranslation();
    const { user, setManagedElderly } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [managedList, setManagedList] = useState<ManagedElderly[]>([]);
    const [loading, setLoading] = useState(true);

    const handleManage = (person: ManagedElderly) => {
        setManagedElderly({ id: person.id, name: person.name, email: person.email });
        navigate("/app");
    };

    const fetchManagedElderly = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const response = await authApi.getManagedElderly(user.id);
            setManagedList(response.data.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone || "---",
                avatarLetter: u.name.charAt(0).toUpperCase(),
                status: 'connected'
            })));
        } catch (err) {
            console.error("Failed to fetch managed elderly", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManagedElderly();
    }, [user?.id]);

    return (
        <div className="elderly-container">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>{t('link_accounts')}</h1>
                <button
                    className="btn-add-elderly"
                    onClick={() => setIsModalOpen(true)}
                    style={{
                        backgroundColor: '#2563EB',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    <Plus size={20} /> Liên kết tài khoản
                </button>
            </header>

            <AddElderlyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchManagedElderly}
            />

            {/* Danh sách quản lý */}
            <section className="connections-section">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : managedList.length === 0 ? (
                    <div className="empty-state">
                        <UserPlus size={48} className="empty-icon" />
                        <h3>Chưa có người thân</h3>
                        <p>Hãy liên kết với tài khoản người thân để bắt đầu theo dõi sức khỏe.</p>
                        <button className="btn-add-elderly-empty" onClick={() => setIsModalOpen(true)}>
                            <Plus size={20} /> Liên kết ngay
                        </button>
                    </div>
                ) : (
                    <div className="elderly-grid">
                        {managedList.map((person) => (
                            <div className="elderly-card" key={person.id}>
                                <div className="card-header-bg"></div>
                                <div className="card-content">
                                    <div className="card-actions">
                                        <MoreVertical size={20} className="icon-more" />
                                    </div>
                                    <div className="avatar-wrapper">
                                        <div className={`avatar-circle bg-${(person.avatarLetter || person.name.charAt(0)).toLowerCase()}`}>
                                            {person.avatarLetter || person.name.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <h4 className="person-name">{person.name}</h4>
                                    <p className="person-email">{person.email}</p>
                                    
                                    <div className="status-badge connected">
                                        <ShieldCheck size={16} /> Đã liên kết
                                    </div>

                                    <div className="card-actions-bottom">
                                        <button
                                            className="btn-manage-elderly"
                                            onClick={() => handleManage(person)}
                                        >
                                            <PlayCircle size={16} />
                                            Tiến hành quản lý
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};