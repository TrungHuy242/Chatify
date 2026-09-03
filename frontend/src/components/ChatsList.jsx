import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import { getDisplayName } from "../lib/nicknameHelper";

function ChatsList() {
    const { getMyChatPartners, chats, isUsersLoading, setSelectedUser, sidebarSearchTerm, showOnlyOnline } = useChatStore();
    const { onlineUsers, authUser } = useAuthStore();

    useEffect(() => {
        getMyChatPartners();
    }, [getMyChatPartners]);

    if (isUsersLoading) return <UsersLoadingSkeleton />;
    if (chats.length === 0) return <NoChatsFound />;

    const removeVietnameseTones = (str) => {
        if (!str) return "";
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .toLowerCase();
    };

    const filteredChats = chats.filter((chat) => {
        if (showOnlyOnline && !onlineUsers.includes(chat._id)) {
            return false;
        }
        if (!sidebarSearchTerm || !sidebarSearchTerm.trim()) return true;
        const displayName = getDisplayName(chat, authUser);
        const query = removeVietnameseTones(sidebarSearchTerm.trim());
        const name = removeVietnameseTones(displayName);
        const originalName = removeVietnameseTones(chat.fullName);
        return name.includes(query) || originalName.includes(query) || displayName.toLowerCase().includes(sidebarSearchTerm.toLowerCase().trim());
    });

    if (filteredChats.length === 0) {
        if (showOnlyOnline) {
            return (
                <div className="text-center py-8 px-4 text-slate-400 text-xs space-y-1">
                    <p>Không có cuộc trò chuyện nào đang online</p>
                    <p className="text-slate-500 text-[11px]">Tắt bộ lọc để xem tất cả</p>
                </div>
            );
        }
        if (sidebarSearchTerm && sidebarSearchTerm.trim()) {
            return (
                <div className="text-center py-8 px-4 text-slate-400 text-xs space-y-1">
                    <p>Không tìm thấy cuộc trò chuyện nào phù hợp</p>
                    <p className="text-slate-500 text-[11px]">Thử tìm với từ khóa khác xem sao</p>
                </div>
            );
        }
    }

    return (
        <>
            {filteredChats.map((chat) => {
                const displayName = getDisplayName(chat, authUser);
                return (
                    <div
                        key={chat._id}
                        className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
                        onClick={() => setSelectedUser(chat)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`avatar ${onlineUsers.includes(chat._id) ? "online" : "offline"}`}>
                                    <div className="size-12 rounded-full">
                                        <img src={chat.profilePic || "/avatar.png"} alt={chat.fullName} />
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-slate-200 font-medium truncate">{displayName}</h4>
                                    {displayName !== chat.fullName && (
                                        <p className="text-[11px] text-slate-400 truncate">({chat.fullName})</p>
                                    )}
                                </div>
                            </div>
                            {chat.unreadCount > 0 && (
                                <div className="badge badge-error text-white font-bold text-xs size-6 flex-shrink-0 ml-2 shadow-sm">
                                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </>
    );
}
export default ChatsList;