import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

function ContactList() {
    const { getAllContacts, allContacts, setSelectedUser, isUsersLoading, sidebarSearchTerm } = useChatStore();
    const { onlineUsers } = useAuthStore();

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
        if (!sidebarSearchTerm || !sidebarSearchTerm.trim()) return true;
        const query = removeVietnameseTones(sidebarSearchTerm.trim());
        const name = removeVietnameseTones(contact.fullName);
        return name.includes(query) || contact.fullName.toLowerCase().includes(sidebarSearchTerm.toLowerCase().trim());
    });

    if (sidebarSearchTerm && sidebarSearchTerm.trim() && filteredContacts.length === 0) {
        return (
            <div className="text-center py-8 px-4 text-slate-400 text-xs space-y-1">
                <p>Không tìm thấy bạn bè nào phù hợp</p>
                <p className="text-slate-500 text-[11px]">Thử tìm với từ khóa khác xem sao</p>
            </div>
        );
    }

    return (
        <>
            {filteredContacts.map((contact) => (
                <div
                    key={contact._id}
                    className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
                    onClick={() => setSelectedUser(contact)}
                >
                    <div className="flex items-center gap-3">
                        <div className={`avatar ${onlineUsers.includes(contact._id) ? "online" : "offline"}`}>
                            <div className="size-12 rounded-full">
                                <img src={contact.profilePic || "/avatar.png"} />
                            </div>
                        </div>
                        <h4 className="text-slate-200 font-medium">{contact.fullName}</h4>
                    </div>
                </div>
            ))}
        </>
    );
}
export default ContactList;