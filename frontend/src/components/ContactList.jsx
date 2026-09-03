import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { getDisplayName } from "../lib/nicknameHelper";

function ContactList() {
    const { getAllContacts, allContacts, setSelectedUser, isUsersLoading, sidebarSearchTerm, showOnlyOnline } = useChatStore();
    const { onlineUsers, authUser } = useAuthStore();

    useEffect(() => {
        getAllContacts();
    }, [getAllContacts]);

    if (isUsersLoading) return <UsersLoadingSkeleton />;

    const removeVietnameseTones = (str) => {
        if (!str) return "";
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .toLowerCase();
    };

    const filteredContacts = allContacts.filter((contact) => {
        if (showOnlyOnline && !onlineUsers.includes(contact._id)) {
            return false;
        }
        if (!sidebarSearchTerm || !sidebarSearchTerm.trim()) return true;
        const displayName = getDisplayName(contact, authUser);
        const query = removeVietnameseTones(sidebarSearchTerm.trim());
        const name = removeVietnameseTones(displayName);
        const originalName = removeVietnameseTones(contact.fullName);
        return name.includes(query) || originalName.includes(query) || displayName.toLowerCase().includes(sidebarSearchTerm.toLowerCase().trim());
    });

    if (filteredContacts.length === 0) {
        if (showOnlyOnline) {
            return (
                <div className="text-center py-8 px-4 text-slate-400 text-xs space-y-1">
                    <p>Không có bạn bè nào đang online</p>
                    <p className="text-slate-500 text-[11px]">Tắt bộ lọc để xem tất cả</p>
                </div>
            );
        }
        if (sidebarSearchTerm && sidebarSearchTerm.trim()) {
            return (
                <div className="text-center py-8 px-4 text-slate-400 text-xs space-y-1">
                    <p>Không tìm thấy bạn bè nào phù hợp</p>
                    <p className="text-slate-500 text-[11px]">Thử tìm với từ khóa khác xem sao</p>
                </div>
            );
        }
    }

    return (
        <>
            {filteredContacts.map((contact) => {
                const displayName = getDisplayName(contact, authUser);
                return (
                    <div
                        key={contact._id}
                        className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
                        onClick={() => setSelectedUser(contact)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`avatar ${onlineUsers.includes(contact._id) ? "online" : "offline"}`}>
                                <div className="size-12 rounded-full">
                                    <img src={contact.profilePic || "/avatar.png"} alt={contact.fullName} />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-slate-200 font-medium truncate">{displayName}</h4>
                                {displayName !== contact.fullName && (
                                    <p className="text-[11px] text-slate-400 truncate">({contact.fullName})</p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </>
    );
}
export default ContactList;