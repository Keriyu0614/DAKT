import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, UserPlus, MoreVertical, ShieldCheck, Plus } from "lucide-react";
import authApi from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";
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
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [managedList, setManagedList] = useState<ManagedElderly[]>([]);
    const [loading, setLoading] = useState(true);

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
                    <Plus size={20} /> Thêm tài khoản
                </button>
            </header>

            <AddElderlyModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={fetchManagedElderly}
            />

            {/* Khu vực tìm kiếm */}
            <section className="search-section">
                <div className="search-card">
                    <h3>{t('enter_relative_info')}</h3>
                    <div className="search-input-wrapper">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <p className="search-hint">{t('search_hint')}</p>
                </div>
            </section>

            {/* Danh sách gợi ý / Quản lý */}
            <section className="connections-section">
                <h3>{t('connection_suggestions')}</h3>
                <div className="elderly-grid">
                    {managedList.map((person) => (
                        <div className="elderly-card" key={person.id}>
                            <div className="card-actions">
                                <MoreVertical size={18} />
                            </div>
                            <div className={`avatar-circle bg-${(person.avatarLetter || person.name.charAt(0)).toLowerCase()}`}>
                                {person.avatarLetter || person.name.charAt(0).toUpperCase()}
                            </div>
                            <h4 className="person-name">{person.name}</h4>
                            <p className="person-phone">📞 {person.phone}</p>

                            <button className="btn-connect-invite">
                                <UserPlus size={16} /> {t('send_invite')}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Danh sách đã liên kết (Quản lý) */}
            <section className="managed-list-section">
                <h3>{t('managing_relatives')}</h3>
                <div className="managed-table-wrapper">
                    {loading ? (
                        <p style={{ padding: '20px', textAlign: 'center' }}>Đang tải dữ liệu...</p>
                    ) : managedList.length === 0 ? (
                        <p style={{ padding: '20px', textAlign: 'center' }}>Chưa có người thân nào được quản lý.</p>
                    ) : (
                        <table className="managed-table">
                            <thead>
                                <tr>
                                    <th>{t('member')}</th>
                                    <th>{t('phone_number')}</th>
                                    <th>{t('status')}</th>
                                    <th>{t('action')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {managedList.map(person => (
                                    <tr key={person.id}>
                                        <td>
                                            <div className="table-user-info">
                                                <span className="avatar-small">{person.avatarLetter || person.name.charAt(0).toUpperCase()}</span>
                                                <div>
                                                    <p className="fw-bold">{person.name}</p>
                                                    <p className="text-muted">{person.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{person.phone}</td>
                                        <td>
                                            <span className="status-chip connected">
                                                <ShieldCheck size={14} /> {t('connected')}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn-view-profile">{t('view_profile')}</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>
        </div>
    );
};