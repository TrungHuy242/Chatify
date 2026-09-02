import { useEffect, useRef } from "react";
import { Check, CheckCheck } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";

function ChatContainer() {
    const {
        selectedUser,
        getMessagesByUserId,
        messages,
        isMessagesLoading,
        subscribeToMessages,
        unsubscribeFromMessages,
        subscribeToTyping,
        unsubscribeFromTyping,
        markMessagesAsRead,
        typingUsers,
    } = useChatStore();
    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);

    const isTyping = typingUsers.includes(selectedUser?._id);

    useEffect(() => {
        getMessagesByUserId(selectedUser._id);
        markMessagesAsRead(selectedUser._id);
        subscribeToMessages();
        subscribeToTyping();

        // clean up
        return () => {
            unsubscribeFromMessages();
            unsubscribeFromTyping();
        };
    }, [selectedUser, getMessagesByUserId, markMessagesAsRead, subscribeToMessages, unsubscribeFromMessages, subscribeToTyping, unsubscribeFromTyping]);

    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    return (
        <>
            <ChatHeader />
            <div className="flex-1 px-6 overflow-y-auto py-8">
                {messages.length > 0 && !isMessagesLoading ? (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {messages.map((msg) => (
                            <div
                                key={msg._id}
                                className={`chat ${msg.senderId === authUser._id ? "chat-end" : "chat-start"}`}
                            >
                                <div
                                    className={`chat-bubble relative ${msg.senderId === authUser._id
                                        ? "bg-cyan-600 text-white"
                                        : "bg-slate-800 text-slate-200"
                                        }`}
                                >
                                    {msg.image && (
                                        <img src={msg.image} alt="Shared" className="rounded-lg h-48 object-cover" />
                                    )}
                                    {msg.text && <p className="mt-2">{msg.text}</p>}
                                    <p className="text-xs mt-1 opacity-75 flex items-center justify-end gap-1">
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
        </>
    );
}

export default ChatContainer;