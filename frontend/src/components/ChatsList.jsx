import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import { getDisplayName } from "../lib/nicknameHelper";

function ChatsList() {
    const { getMyChatPartners, chats, isUsersLoading, selectedUser, setSelectedUser, sidebarSearchTerm, showOnlyOnline } = useChatStore();
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
                <div className="text-center py-10 px-4 text-slate-400 text-xs space-y-1">
                    <p>Không có cuộc trò chuyện nào đang online</p>
                    <p className="text-slate-500 text-[11px]">Tắt bộ lọc để xem tất cả</p>
                </div>
            );
        }
        if (sidebarSearchTerm && sidebarSearchTerm.trim()) {
            return (
                <div className="text-center py-10 px-4 text-slate-400 text-xs space-y-1">
                    <p>Không tìm thấy cuộc trò chuyện nào phù hợp</p>
                    <p className="text-slate-500 text-[11px]">Thử tìm với từ khóa khác xem sao</p>
                </div>
            );
        }
    }

    return (
        <div className="space-y-1">
            {filteredChats.map((chat) => {
                const displayName = getDisplayName(chat, authUser);
                const isSelected = selectedUser?._id === chat._id;
                const isOnline = onlineUsers.includes(chat._id);

                return (
                    <div
                        key={chat._id}
                        className={`p-2.5 sm:p-3 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                            isSelected
                                ? "bg-blue-600/20 border-blue-500/40 text-white shadow-sm"
                                : "border-transparent hover:bg-slate-800/60 text-slate-200"
                        }`}
                        onClick={() => setSelectedUser(chat)}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`avatar ${isOnline ? "online" : "offline"} flex-shrink-0`}>
                                <div className="size-11 sm:size-12 rounded-full ring-1 ring-slate-700/60">
                                    <img src={chat.profilePic || "/avatar.png"} alt={chat.fullName} />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-medium text-sm text-slate-100 truncate">{displayName}</h4>
                                {displayName !== chat.fullName ? (
                                    <p className="text-[11px] text-slate-400 truncate">({chat.fullName})</p>
                                ) : (
                                    <p className="text-[11px] text-slate-500 truncate">
                                        {isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                                    </p>
                                )}
                            </div>
                        </div>
                        {chat.unreadCount > 0 && (
                            <div className="badge badge-error text-white font-bold text-[11px] size-5 flex-shrink-0 ml-2 shadow-sm flex items-center justify-center rounded-full">
                                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
export default ChatsList;