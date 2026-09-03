import { useEffect, useRef, useState } from "react";
import { Check, CheckCheck, Trash2, Reply, SmilePlus, Pin, PinOff, Pencil, ZoomIn, Copy, Download, FileText, FileSpreadsheet, FileArchive, File, RotateCcw } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import ImageModal from "./ImageModal";
import ChatInfoSidebar from "./ChatInfoSidebar";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";

function DisappearingTimerBadge({ expiresAt, onExpire }) {
    const [timeLeft, setTimeLeft] = useState(() => {
        if (!expiresAt) return 0;
        return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
    });

    useEffect(() => {
        if (!expiresAt) return;
        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
            setTimeLeft(remaining);
            if (remaining <= 0) {
                clearInterval(interval);
                onExpire();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt, onExpire]);

    if (timeLeft <= 0) return null;

    const formatCountdown = (seconds) => {
        if (seconds >= 60) {
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return `${m}m${s > 0 ? `${s}s` : ""}`;
        }
        return `${seconds}s`;
    };

    return (
        <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-mono mr-1 animate-pulse" title="Tin nhắn tự hủy">
            ⏳ {formatCountdown(timeLeft)}
        </span>
    );
}

function ChatContainer() {
    const {
        selectedUser,
        getMessagesByUserId,
        messages,
        isMessagesLoading,
        subscribeToTyping,
        unsubscribeFromTyping,
        markMessagesAsRead,
        typingUsers,
        loadMoreMessages,
        isLoadingMore,
        hasMoreMessages,
        revokeMessage,
        setReplyingTo,
        reactToMessage,
        togglePinMessage,
        editMessage,
        isSearching,
        searchQuery,
        isChatInfoOpen,
        setIsChatInfoOpen,
        removeExpiredMessage,
        deleteMessageForMe,
    } = useChatStore();
    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const prevScrollHeightRef = useRef(0);
    const isFetchingRef = useRef(false);
    
    const [activeReactionMessageId, setActiveReactionMessageId] = useState(null);
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editingText, setEditingText] = useState("");
    const [previewImageUrl, setPreviewImageUrl] = useState(null);
    const [copiedMessageId, setCopiedMessageId] = useState(null);
    const [messageToDeleteForMe, setMessageToDeleteForMe] = useState(null);
    const emojis = ["👍", "❤️", "😂", "😮", "😢", "😡"];

    const isTyping = typingUsers.includes(selectedUser?._id);

    const filteredMessages = (isSearching && searchQuery.trim() !== "")
        ? messages.filter((msg) => msg.text?.toLowerCase().includes(searchQuery.toLowerCase()))
        : messages;

    const highlightText = (text, query) => {
        if (!query || !isSearching || !text) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, index) => 
            part.toLowerCase() === query.toLowerCase() 
                ? <mark key={index} className="bg-yellow-400 text-slate-900 rounded-sm px-0.5">{part}</mark> 
                : part
        );
    };

    useEffect(() => {
        getMessagesByUserId(selectedUser._id);
        markMessagesAsRead(selectedUser._id);
        subscribeToTyping();

        // clean up
        return () => {
            unsubscribeFromTyping();
        };
    }, [selectedUser, getMessagesByUserId, markMessagesAsRead, subscribeToTyping, unsubscribeFromTyping]);

    useEffect(() => {
        if (!isLoadingMore && isFetchingRef.current) {
            // Finished loading more messages, adjust scroll position
            if (scrollContainerRef.current) {
                const newScrollHeight = scrollContainerRef.current.scrollHeight;
                const scrollDiff = newScrollHeight - prevScrollHeightRef.current;
                scrollContainerRef.current.scrollTop += scrollDiff;
            }
            isFetchingRef.current = false;
        } else if (!isFetchingRef.current && messageEndRef.current) {
            // New message arrived or initial load, scroll to bottom
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [filteredMessages, isLoadingMore]);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        
        if (scrollContainerRef.current.scrollTop === 0 && hasMoreMessages && !isLoadingMore) {
            prevScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
            isFetchingRef.current = true;
            loadMoreMessages(selectedUser._id);
        }
    };

    const pinnedMessage = messages.slice().reverse().find((m) => m.isPinned && !m.isRevoked);

    const scrollToMessage = (messageId) => {
        const el = document.getElementById(`msg-${messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            setHighlightedMessageId(messageId);
            setTimeout(() => {
                setHighlightedMessageId(null);
            }, 2000);
        }
    };

    const handleStartEdit = (msg) => {
        setEditingMessageId(msg._id);
        setEditingText(msg.text || "");
    };

    const handleSaveEdit = (msgId, originalText) => {
        if (!editingText.trim()) {
            toast.error("Nội dung tin nhắn không được để trống");
            return;
        }
        if (editingText.trim() === originalText) {
            setEditingMessageId(null);
            return;
        }
        editMessage(msgId, editingText.trim());
        setEditingMessageId(null);
    };

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    const getFileIcon = (filename) => {
        if (!filename) return <File className="w-5 h-5 text-slate-300" />;
        const ext = filename.split(".").pop().toLowerCase();
        if (["pdf"].includes(ext)) {
            return <FileText className="w-5 h-5 text-red-400" />;
        }
        if (["doc", "docx", "txt"].includes(ext)) {
            return <FileText className="w-5 h-5 text-blue-400" />;
        }
        if (["xls", "xlsx", "csv"].includes(ext)) {
            return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
        }
        if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
            return <FileArchive className="w-5 h-5 text-amber-400" />;
        }
        return <File className="w-5 h-5 text-slate-300" />;
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

    const handleCopyText = (messageId, text) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            setCopiedMessageId(messageId);
            toast.success("Đã sao chép vào bộ nhớ tạm");
            setTimeout(() => {
                setCopiedMessageId(null);
            }, 1500);
        }).catch((err) => {
            console.error("Copy failed:", err);
            toast.error("Không thể sao chép");
        });
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <ChatHeader />

            <div className="flex-1 flex overflow-hidden">
                {/* Main Chat Column */}
                <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                    {pinnedMessage && (
                <div className="bg-slate-800/90 backdrop-blur border-b border-cyan-500/30 px-6 py-2 flex items-center justify-between text-xs z-10 transition-all shadow-sm">
                    <div 
                        onClick={() => scrollToMessage(pinnedMessage._id)} 
                        className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 mr-4 hover:opacity-90 group"
                    >
                        <div className="p-1 rounded bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                            <Pin className="w-3.5 h-3.5 fill-cyan-400" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-cyan-400 text-[11px] leading-tight">
                                Tin nhắn đã ghim • {pinnedMessage.senderId === authUser._id ? "Bạn" : selectedUser.fullName}
                            </span>
                            <span className="text-slate-300 truncate max-w-md">
                                {pinnedMessage.text ? (
                                    pinnedMessage.text
                                ) : pinnedMessage.image ? (
                                    <span className="italic">[Hình ảnh]</span>
                                ) : pinnedMessage.fileUrl ? (
                                    <span className="italic">[Tài liệu: {pinnedMessage.fileName || "Tệp đính kèm"}]</span>
                                ) : (
                                    <span className="italic">[Tin nhắn thoại]</span>
                                )}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => togglePinMessage(pinnedMessage._id)}
                        className="text-slate-400 hover:text-red-400 p-1 rounded transition-colors tooltip tooltip-left"
                        data-tip="Bỏ ghim"
                    >
                        <PinOff className="w-4 h-4" />
                    </button>
                </div>
            )}
            <div 
                className="flex-1 px-6 overflow-y-auto py-8" 
                ref={scrollContainerRef} 
                onScroll={handleScroll}
            >
                {isLoadingMore && (
                    <div className="flex justify-center py-2">
                        <span className="loading loading-spinner loading-md text-primary opacity-60"></span>
                    </div>
                )}
                {filteredMessages.length > 0 && !isMessagesLoading ? (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {filteredMessages.map((msg) => (
                            <div
                                key={msg._id}
                                id={`msg-${msg._id}`}
                                className={`chat ${msg.senderId === authUser._id ? "chat-end" : "chat-start"} group transition-all duration-300 ${
                                    highlightedMessageId === msg._id ? "scale-[1.02]" : ""
                                }`}
                            >
                                {/* Hover actions */}
                                {!msg.isRevoked && (
                                    <div className={`chat-header opacity-0 group-hover:opacity-100 transition-opacity flex items-center mb-1 gap-1 relative ${msg.senderId === authUser._id ? "" : "flex-row-reverse"}`}>
                                        <button
                                            onClick={() => setActiveReactionMessageId(activeReactionMessageId === msg._id ? null : msg._id)}
                                            className="text-slate-400 hover:text-yellow-400 p-1 rounded transition-colors tooltip tooltip-top"
                                            data-tip="Cảm xúc"
                                        >
                                            <SmilePlus className="w-4 h-4" />
                                        </button>

                                        {/* Reaction Picker Popup */}
                                        {activeReactionMessageId === msg._id && (
                                            <div className={`absolute bottom-full mb-2 bg-slate-800 border border-slate-700 shadow-lg rounded-full flex gap-1 p-1 z-10 ${msg.senderId === authUser._id ? "right-0" : "left-0"}`}>
                                                {emojis.map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => {
                                                            reactToMessage(msg._id, emoji);
                                                            setActiveReactionMessageId(null);
                                                        }}
                                                        className="hover:bg-slate-700 p-1.5 rounded-full transition-transform hover:scale-125"
                                                    >
                                                        <span className="text-xl leading-none block">{emoji}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setReplyingTo(msg)}
                                            className="text-slate-400 hover:text-cyan-400 p-1 rounded transition-colors tooltip tooltip-top"
                                            data-tip="Trả lời"
                                        >
                                            <Reply className="w-4 h-4" />
                                        </button>
                                        
                                        <button
                                            onClick={() => togglePinMessage(msg._id)}
                                            className={`p-1 rounded transition-colors tooltip tooltip-top ${
                                                msg.isPinned
                                                    ? "text-cyan-400 hover:text-cyan-300"
                                                    : "text-slate-400 hover:text-cyan-400"
                                            }`}
                                            data-tip={msg.isPinned ? "Bỏ ghim" : "Ghim"}
                                        >
                                            <Pin className={`w-4 h-4 ${msg.isPinned ? "fill-cyan-400" : ""}`} />
                                        </button>

                                        {msg.text && (
                                            <button
                                                onClick={() => handleCopyText(msg._id, msg.text)}
                                                className={`p-1 rounded transition-colors tooltip tooltip-top ${
                                                    copiedMessageId === msg._id
                                                        ? "text-green-400"
                                                        : "text-slate-400 hover:text-cyan-400"
                                                }`}
                                                data-tip={copiedMessageId === msg._id ? "Đã chép!" : "Sao chép"}
                                            >
                                                {copiedMessageId === msg._id ? (
                                                    <Check className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </button>
                                        )}

                                        {msg.senderId === authUser._id && msg.text && (
                                            <button
                                                onClick={() => handleStartEdit(msg)}
                                                className="text-slate-400 hover:text-cyan-400 p-1 rounded transition-colors tooltip tooltip-top"
                                                data-tip="Chỉnh sửa"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        )}

                                        {msg.senderId === authUser._id && (
                                            <button
                                                onClick={() => revokeMessage(msg._id)}
                                                className="text-slate-400 hover:text-amber-400 p-1 rounded transition-colors tooltip tooltip-top"
                                                data-tip="Thu hồi (cả 2 bên)"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setMessageToDeleteForMe(msg)}
                                            className="text-slate-400 hover:text-red-400 p-1 rounded transition-colors tooltip tooltip-top tooltip-error"
                                            data-tip="Xóa ở phía tôi"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                
                                <div
                                    className={`chat-bubble relative transition-all duration-300 text-sm leading-relaxed ${
                                        highlightedMessageId === msg._id ? "ring-2 ring-blue-400 shadow-lg shadow-blue-500/30" : ""
                                    } ${
                                        msg.isRevoked
                                            ? "bg-slate-800/60 text-slate-400 border border-slate-700/40"
                                            : msg.senderId === authUser._id
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : "bg-[#161d2d] text-slate-100 border border-slate-800/80"
                                    }`}
                                >
                                    {msg.isPinned && !msg.isRevoked && (
                                        <div className="flex items-center gap-1 text-[11px] text-cyan-300 font-medium mb-1 opacity-90 border-b border-cyan-400/20 pb-0.5">
                                            <Pin className="w-3 h-3 fill-cyan-300" />
                                            <span>Đã ghim</span>
                                        </div>
                                    )}
                                    {msg.isRevoked ? (
                                        <p className="italic text-sm py-1 opacity-80">Tin nhắn đã bị thu hồi</p>
                                    ) : (
                                        <>
                                            {/* Render replied message preview */}
                                            {msg.replyTo && (
                                                <div className={`mb-2 p-2 rounded-lg text-sm border-l-4 ${msg.senderId === authUser._id ? "bg-cyan-700/50 border-cyan-300" : "bg-slate-700/50 border-cyan-500"}`}>
                                                    <p className="font-semibold text-xs mb-1 opacity-80">
                                                        {msg.replyTo.senderId === authUser._id ? "Trả lời chính mình" : "Trả lời tin nhắn"}
                                                    </p>
                                                    <p className="truncate opacity-75">
                                                        {msg.replyTo.isRevoked ? (
                                                            <span className="italic">Tin nhắn đã bị thu hồi</span>
                                                        ) : msg.replyTo.text ? (
                                                            msg.replyTo.text
                                                        ) : msg.replyTo.image ? (
                                                            <span className="italic">[Hình ảnh]</span>
                                                        ) : msg.replyTo.fileUrl ? (
                                                            <span className="italic">[Tài liệu: {msg.replyTo.fileName || "Tệp đính kèm"}]</span>
                                                        ) : (
                                                            <span className="italic">[Tin nhắn thoại]</span>
                                                        )}
                                                    </p>
                                                </div>
                                            )}

                                            {msg.image && (
                                                <div
                                                    onClick={() => setPreviewImageUrl(msg.image)}
                                                    className="relative group/img cursor-pointer overflow-hidden rounded-lg mt-1 inline-block"
                                                >
                                                    <img
                                                        src={msg.image}
                                                        alt="Shared"
                                                        className="rounded-lg h-48 w-auto max-w-xs object-cover transition-transform duration-300 group-hover/img:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                                                            <ZoomIn className="w-3.5 h-3.5" /> Phóng to
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            {msg.audio && (
                                                <audio src={msg.audio} controls className="h-10 w-[200px]" />
                                            )}
                                            {msg.fileUrl && (
                                                <div className={`mt-1 p-2.5 rounded-xl flex items-center justify-between gap-3 border shadow-sm ${
                                                    msg.senderId === authUser._id 
                                                        ? "bg-cyan-700/60 border-cyan-500/40 text-white" 
                                                        : "bg-slate-900/80 border-slate-700/70 text-slate-200"
                                                }`}>
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className={`p-2 rounded-lg ${
                                                            msg.senderId === authUser._id ? "bg-cyan-800/80" : "bg-slate-800"
                                                        }`}>
                                                            {getFileIcon(msg.fileName)}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-medium truncate max-w-[150px] sm:max-w-[210px]" title={msg.fileName}>
                                                                {msg.fileName || "Tài liệu đính kèm"}
                                                            </span>
                                                            <span className="text-[11px] opacity-75">
                                                                {formatFileSize(msg.fileSize)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {msg.fileUrl === "uploading" ? (
                                                        <span className="text-xs opacity-75 italic pr-1">Đang tải...</span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDownloadFile(msg.fileUrl, msg.fileName)}
                                                            className={`p-1.5 rounded-lg transition-colors tooltip tooltip-left ${
                                                                msg.senderId === authUser._id
                                                                    ? "hover:bg-cyan-800 text-white"
                                                                    : "hover:bg-slate-700 text-slate-300 hover:text-cyan-400"
                                                            }`}
                                                            data-tip="Tải về"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {editingMessageId === msg._id ? (
                                                <div className="flex flex-col gap-2 min-w-[200px] sm:min-w-[260px] pt-1">
                                                    <textarea
                                                        value={editingText}
                                                        onChange={(e) => setEditingText(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleSaveEdit(msg._id, msg.text);
                                                            } else if (e.key === "Escape") {
                                                                setEditingMessageId(null);
                                                            }
                                                        }}
                                                        className="w-full bg-slate-900/90 border border-cyan-500/60 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 resize-none"
                                                        rows={2}
                                                        autoFocus
                                                    />
                                                    <div className="flex items-center justify-end gap-1.5 text-xs">
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingMessageId(null)}
                                                            className="px-2 py-0.5 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition-colors"
                                                        >
                                                            Hủy (Esc)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSaveEdit(msg._id, msg.text)}
                                                            className="px-2.5 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors shadow-sm"
                                                        >
                                                            Lưu (Enter)
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                msg.text && <p className="mt-2">{highlightText(msg.text, searchQuery)}</p>
                                            )}
                                        </>
                                    )}
                                    
                                    {/* Render Reactions */}
                                    {msg.reactions && msg.reactions.length > 0 && !msg.isRevoked && (
                                        <div className={`absolute -bottom-3 ${msg.senderId === authUser._id ? "right-2" : "left-2"} bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm z-10`}>
                                            {[...new Set(msg.reactions.map(r => r.emoji))].map((emoji, idx) => (
                                                <span key={idx} className="text-xs">{emoji}</span>
                                            ))}
                                            {msg.reactions.length > 1 && (
                                                <span className="text-[10px] text-slate-300 ml-0.5">{msg.reactions.length}</span>
                                            )}
                                        </div>
                                    )}
                                    
                                    {!msg.isRevoked && (
                                        <p className="text-xs mt-1 opacity-75 flex items-center justify-end gap-1">
                                            {msg.expiresAt && (
                                                <DisappearingTimerBadge
                                                    expiresAt={msg.expiresAt}
                                                    onExpire={() => removeExpiredMessage(msg._id)}
                                                />
                                            )}
                                            {msg.isEdited && (
                                                <span className="text-[10px] text-slate-300/70 italic mr-1">
                                                    (đã chỉnh sửa)
                                                </span>
                                            )}
                                            {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                            {msg.senderId === authUser._id && (
                                                <span className="inline-flex items-center gap-1">
                                                    {msg.status === "read" ? (
                                                        <><CheckCheck className="w-4 h-4 text-blue-400" /> <span className="text-[10px] text-blue-400 font-medium">Đã xem</span></>
                                                    ) : msg.status === "delivered" ? (
                                                        <><CheckCheck className="w-4 h-4 text-slate-300" /> <span className="text-[10px] text-slate-300">Đã nhận</span></>
                                                    ) : (
                                                        <><Check className="w-4 h-4 text-slate-300" /> <span className="text-[10px] text-slate-300">Đã gửi</span></>
                                                    )}
                                                </span>
                                            )}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                        
                        {/* Typing indicator bubble */}
                        {isTyping && (
                            <div className="chat chat-start">
                                <div className="chat-bubble relative bg-slate-800 text-slate-200 flex items-center p-3 h-10 w-16">
                                    <span className="loading loading-dots loading-sm opacity-60"></span>
                                </div>
                            </div>
                        )}

                        {/* 👇 scroll target */}
                        <div ref={messageEndRef} />
                    </div>
                ) : isMessagesLoading ? (
                    <MessagesLoadingSkeleton />
                ) : (
                    <NoChatHistoryPlaceholder name={selectedUser.fullName} />
                )}
            </div>

                    <MessageInput />
                </div>

                {/* Right Chat Info Sidebar */}
                {isChatInfoOpen && (
                    <ChatInfoSidebar
                        onClose={() => setIsChatInfoOpen(false)}
                        onPreviewImage={(url) => setPreviewImageUrl(url)}
                        onScrollToMessage={(id) => scrollToMessage(id)}
                    />
                )}
            </div>

            {/* Lightbox Modal */}
            {previewImageUrl && (
                <ImageModal
                    imageUrl={previewImageUrl}
                    onClose={() => setPreviewImageUrl(null)}
                />
            )}

            {/* Modal xác nhận Xóa ở phía tôi */}
            {messageToDeleteForMe && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 text-red-400">
                            <div className="p-2.5 rounded-full bg-red-500/10">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-slate-100 text-base">Xóa tin nhắn ở phía bạn?</h3>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Tin nhắn này sẽ bị xóa khỏi màn hình của bạn. Đối phương vẫn sẽ nhìn thấy tin nhắn này bình thường.
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setMessageToDeleteForMe(null)}
                                className="px-3.5 py-1.5 rounded-xl text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    await deleteMessageForMe(messageToDeleteForMe._id);
                                    setMessageToDeleteForMe(null);
                                }}
                                className="px-4 py-1.5 rounded-xl text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm shadow-red-500/30"
                            >
                                Xóa ở phía tôi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatContainer;