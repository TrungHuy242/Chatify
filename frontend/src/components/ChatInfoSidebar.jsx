import { useState } from "react";
import { X, Image as ImageIcon, FileText, FileSpreadsheet, FileArchive, File, Pin, PinOff, Download, ChevronDown, ChevronRight } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

function ChatInfoSidebar({ onClose, onPreviewImage, onScrollToMessage }) {
    const { selectedUser, messages, togglePinMessage } = useChatStore();
    const { onlineUsers } = useAuthStore();

    // Collapsible sections state
    const [isMediaOpen, setIsMediaOpen] = useState(true);
    const [isFilesOpen, setIsFilesOpen] = useState(true);
    const [isPinnedOpen, setIsPinnedOpen] = useState(true);

    if (!selectedUser) return null;

    const isOnline = onlineUsers.includes(selectedUser._id);

    // Filter shared items
    const mediaMessages = messages.filter((m) => m.image && !m.isRevoked);
    const fileMessages = messages.filter((m) => m.fileUrl && !m.isRevoked);
    const pinnedMessages = messages.filter((m) => m.isPinned && !m.isRevoked);

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    const getFileIcon = (filename) => {
        if (!filename) return <File className="w-4 h-4 text-slate-300" />;
        const ext = filename.split(".").pop().toLowerCase();
        if (["pdf"].includes(ext)) return <FileText className="w-4 h-4 text-red-400" />;
        if (["doc", "docx", "txt"].includes(ext)) return <FileText className="w-4 h-4 text-blue-400" />;
        if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
        if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return <FileArchive className="w-4 h-4 text-amber-400" />;
        return <File className="w-4 h-4 text-slate-300" />;
    };

    const handleDownloadFile = async (url, filename) => {
        if (!url) return;
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename || `file-${Date.now()}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
            toast.success("Đang tải file xuống...");
        } catch (err) {
            window.open(url, "_blank");
        }
    };

    return (
        <div className="w-80 bg-slate-900/90 border-l border-slate-700/60 flex flex-col h-full overflow-hidden flex-none animate-in slide-in-from-right-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60 min-h-[72px]">
                <h3 className="font-semibold text-slate-200 text-sm">Thông tin hội thoại</h3>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    title="Đóng"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
                {/* Profile Overview */}
                <div className="flex flex-col items-center text-center pb-4 border-b border-slate-800">
                    <div className="relative mb-3">
                        <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-cyan-500/40 shadow-lg">
                            <img
                                src={selectedUser.profilePic || "/avatar.png"}
                                alt={selectedUser.fullName}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span
                            className={`absolute bottom-0 right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                                isOnline ? "bg-emerald-500" : "bg-slate-500"
                            }`}
                        />
                    </div>
                    <h4 className="font-semibold text-slate-100 text-base">{selectedUser.fullName}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedUser.email}</p>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-cyan-400 border border-slate-700">
                        {isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                    </span>
                </div>

                {/* Section 1: Shared Media / Photos */}
                <div>
                    <button
                        onClick={() => setIsMediaOpen(!isMediaOpen)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 hover:text-cyan-400 transition-colors"
                    >
                        <div className="flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Ảnh đã chia sẻ ({mediaMessages.length})</span>
                        </div>
                        {isMediaOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>

                    {isMediaOpen && (
                        <div>
                            {mediaMessages.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                                    {mediaMessages.map((m) => (
                                        <div
                                            key={m._id}
                                            onClick={() => onPreviewImage && onPreviewImage(m.image)}
                                            className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-slate-800 border border-slate-700/50"
                                        >
                                            <img
                                                src={m.image}
                                                alt="Shared media"
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 italic py-1">Chưa có ảnh nào được chia sẻ</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Section 2: Shared Documents */}
                <div>
                    <button
                        onClick={() => setIsFilesOpen(!isFilesOpen)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 hover:text-cyan-400 transition-colors"
                    >
                        <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Tài liệu đã gửi ({fileMessages.length})</span>
                        </div>
                        {isFilesOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>

                    {isFilesOpen && (
                        <div>
                            {fileMessages.length > 0 ? (
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                    {fileMessages.map((m) => (
                                        <div
                                            key={m._id}
                                            className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:bg-slate-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 min-w-0 pr-1">
                                                <div className="p-1.5 rounded bg-slate-700/60">
                                                    {getFileIcon(m.fileName)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs text-slate-200 truncate font-medium max-w-[140px]" title={m.fileName}>
                                                        {m.fileName || "Tài liệu"}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {formatFileSize(m.fileSize)}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDownloadFile(m.fileUrl, m.fileName)}
                                                className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-colors"
                                                title="Tải về"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 italic py-1">Chưa có tài liệu nào được gửi</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Section 3: Pinned Messages */}
                <div>
                    <button
                        onClick={() => setIsPinnedOpen(!isPinnedOpen)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 hover:text-cyan-400 transition-colors"
                    >
                        <div className="flex items-center gap-1.5">
                            <Pin className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                            <span>Tin nhắn đã ghim ({pinnedMessages.length})</span>
                        </div>
                        {isPinnedOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>

                    {isPinnedOpen && (
                        <div>
                            {pinnedMessages.length > 0 ? (
                                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                    {pinnedMessages.map((m) => (
                                        <div
                                            key={m._id}
                                            onClick={() => onScrollToMessage && onScrollToMessage(m._id)}
                                            className="group p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:border-cyan-500/40 hover:bg-slate-800 transition-all cursor-pointer relative"
                                        >
                                            <div className="flex items-start justify-between gap-1.5 mb-1">
                                                <span className="text-[10px] text-cyan-400 font-medium">
                                                    {new Date(m.createdAt).toLocaleDateString(undefined, {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        togglePinMessage(m._id);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-all"
                                                    title="Bỏ ghim"
                                                >
                                                    <PinOff className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-200 line-clamp-2">
                                                {m.text ? (
                                                    m.text
                                                ) : m.image ? (
                                                    <span className="italic text-slate-400">[Hình ảnh]</span>
                                                ) : m.fileUrl ? (
                                                    <span className="italic text-slate-400">[Tài liệu: {m.fileName}]</span>
                                                ) : (
                                                    <span className="italic text-slate-400">[Tin nhắn thoại]</span>
                                                )}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 italic py-1">Chưa có tin nhắn nào được ghim</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChatInfoSidebar;
