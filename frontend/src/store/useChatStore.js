import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { notifyNewMessage } from "../lib/tabNotifier";

export const useChatStore = create((set, get) => ({
    allContacts: [],
    chats: [],
    messages: [],
    typingUsers: [],
    activeTab: "chats",
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    hasMoreMessages: false,
    isLoadingMore: false,
    replyingTo: null,
    isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,
    isSearching: false,
    searchQuery: "",
    isChatInfoOpen: false,
    sidebarSearchTerm: "",

    toggleSound: () => {
        localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
        set({ isSoundEnabled: !get().isSoundEnabled });
    },

    setActiveTab: (tab) => set({ activeTab: tab }),
    setReplyingTo: (message) => set({ replyingTo: message }),
    clearReplyingTo: () => set({ replyingTo: null }),
    setIsSearching: (isSearching) => set({ isSearching }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setSidebarSearchTerm: (sidebarSearchTerm) => set({ sidebarSearchTerm }),
    setIsChatInfoOpen: (isChatInfoOpen) => set({ isChatInfoOpen }),
    toggleChatInfo: () => set((state) => ({ isChatInfoOpen: !state.isChatInfoOpen })),
    setSelectedUser: (selectedUser) => {
        set({ selectedUser, isChatInfoOpen: false });
        if (selectedUser) {
            const state = get();
            const chatIndex = state.chats.findIndex((c) => c._id === selectedUser._id);
            if (chatIndex !== -1) {
                let updatedChats = [...state.chats];
                updatedChats[chatIndex] = { ...updatedChats[chatIndex], unreadCount: 0 };
                set({ chats: updatedChats });
            }
        }
    },

    getAllContacts: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/messages/contacts");
            set({ allContacts: res.data });
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isUsersLoading: false });
        }
    },
    getMyChatPartners: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/messages/chats");
            set({ chats: res.data });
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessagesByUserId: async (userId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            // res.data is now { messages: [...], hasMore: boolean }
            // But just in case the backend hasn't been updated yet or returns array
            if (Array.isArray(res.data)) {
                set({ messages: res.data, hasMoreMessages: false });
            } else {
                set({ messages: res.data.messages, hasMoreMessages: res.data.hasMore });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    loadMoreMessages: async (userId) => {
        const { messages, isLoadingMore, hasMoreMessages } = get();
        if (isLoadingMore || !hasMoreMessages || messages.length === 0) return;

        set({ isLoadingMore: true });
        try {
            const oldestMessage = messages[0];
            const cursor = oldestMessage.createdAt;
            
            const res = await axiosInstance.get(`/messages/${userId}?cursor=${cursor}`);
            
            if (Array.isArray(res.data)) {
                set({ messages: [...res.data, ...messages], hasMoreMessages: false });
            } else {
                set({ 
                    messages: [...res.data.messages, ...messages], 
                    hasMoreMessages: res.data.hasMore 
                });
            }
        } catch (error) {
            console.log("Error loading more messages:", error);
            toast.error(error.response?.data?.message || "Failed to load older messages");
        } finally {
            set({ isLoadingMore: false });
        }
    },

    markMessagesAsRead: async (userId) => {
        try {
            await axiosInstance.put(`/messages/${userId}/read`);
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg.senderId === userId && msg.status !== "read"
                        ? { ...msg, status: "read" }
                        : msg
                ),
            }));
        } catch (error) {
            console.log("Error marking messages as read:", error);
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages, replyingTo } = get();
        const { authUser } = useAuthStore.getState();

        const tempId = `temp-${Date.now()}`;

        const optimisticMessage = {
            _id: tempId,
            senderId: authUser._id,
            receiverId: selectedUser._id,
            text: messageData.text,
            image: messageData.image,
            audio: messageData.audio,
            fileUrl: messageData.file ? "uploading" : undefined,
            fileName: messageData.fileName,
            fileSize: messageData.fileSize,
            createdAt: new Date().toISOString(),
            isOptimistic: true, // flag to identify optimistic messages (optional)
            replyTo: replyingTo || null,
        };
        // immediately update the ui by adding the message
        set({ messages: [...messages, optimisticMessage] });
        
        // Include replyTo in payload
        if (replyingTo) {
            messageData.replyTo = replyingTo._id;
        }
        
        get().clearReplyingTo();

        // Update chats list (move to top and update lastMessageAt)
        const state = get();
        const chatIndex = state.chats.findIndex((c) => c._id === selectedUser._id);
        if (chatIndex !== -1) {
            let updatedChats = [...state.chats];
            const chat = { ...updatedChats[chatIndex] };
            chat.lastMessageAt = optimisticMessage.createdAt;
            updatedChats.splice(chatIndex, 1);
            updatedChats.unshift(chat);
            set({ chats: updatedChats });
        }

        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === tempId ? res.data : msg
                ),
            }));
        } catch (error) {
            // remove optimistic message on failure
            set((state) => ({
                messages: state.messages.filter((msg) => msg._id !== tempId),
            }));
            toast.error(error.response?.data?.message || "Something went wrong");
        }
    },

    revokeMessage: async (messageId) => {
        try {
            await axiosInstance.delete(`/messages/${messageId}/revoke`);
            // Update local state immediately
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId
                        ? { ...msg, isRevoked: true, text: "", image: "", audio: "", isPinned: false }
                        : msg
                ),
            }));
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to revoke message");
        }
    },

    togglePinMessage: async (messageId) => {
        try {
            const res = await axiosInstance.put(`/messages/${messageId}/pin`);
            const isPinned = res.data.isPinned;
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId ? { ...msg, isPinned } : msg
                ),
            }));
            toast.success(isPinned ? "Đã ghim tin nhắn" : "Đã bỏ ghim tin nhắn");
        } catch (error) {
            toast.error(error.response?.data?.error || error.response?.data?.message || "Thao tác thất bại");
        }
    },

    reactToMessage: async (messageId, emoji) => {
        try {
            const res = await axiosInstance.post(`/messages/${messageId}/react`, { emoji });
            // Update local state immediately
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId
                        ? { ...msg, reactions: res.data.reactions }
                        : msg
                ),
            }));
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to react to message");
        }
    },

    editMessage: async (messageId, text) => {
        try {
            const res = await axiosInstance.put(`/messages/${messageId}/edit`, { text });
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId ? { ...msg, text: res.data.text, isEdited: true } : msg
                ),
            }));
            toast.success("Đã cập nhật tin nhắn");
        } catch (error) {
            toast.error(error.response?.data?.error || error.response?.data?.message || "Chỉnh sửa thất bại");
        }
    },

    subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        
        // Remove existing listener to prevent duplicates
        socket.off("newMessage");

        socket.on("newMessage", (newMessage) => {
            const state = get();
            const selectedUser = state.selectedUser;
            const senderId = newMessage.senderId;

            // Update the chats list (sidebar)
            const chatIndex = state.chats.findIndex((c) => c._id === senderId);
            let updatedChats = [...state.chats];
            
            if (chatIndex !== -1) {
                const chat = { ...updatedChats[chatIndex] };
                chat.lastMessageAt = newMessage.createdAt;
                
                // Only increment unread if we're not currently looking at this chat
                if (!selectedUser || selectedUser._id !== senderId) {
                    chat.unreadCount = (chat.unreadCount || 0) + 1;
                }
                
                // Move to top
                updatedChats.splice(chatIndex, 1);
                updatedChats.unshift(chat);
                set({ chats: updatedChats });
            } else {
                // If not in chat list, fetch the updated list
                state.getMyChatPartners();
            }

            const isMessageSentFromSelectedUser = selectedUser && senderId === selectedUser._id;
            if (isMessageSentFromSelectedUser) {
                set({
                    messages: [...get().messages, newMessage],
                });
                
                // Mark the new message as read since the chat is open
                get().markMessagesAsRead(selectedUser._id);
            }

            // Find sender's name for notification
            const sender = state.chats.find((c) => c._id === senderId) || state.allContacts?.find((c) => c._id === senderId);
            const senderName = sender ? sender.fullName : "Tin nhắn mới";

            notifyNewMessage({
                senderName,
                playSound: get().isSoundEnabled,
            });
        });

        socket.off("messagesRead");

        socket.on("messagesRead", ({ readerId }) => {
            const { selectedUser } = get();
            if (selectedUser && readerId === selectedUser._id) {
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg.receiverId === readerId && msg.status !== "read"
                            ? { ...msg, status: "read" }
                            : msg
                    ),
                }));
            }
        });

        socket.off("messageRevoked");
        socket.on("messageRevoked", (messageId) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId
                        ? { ...msg, isRevoked: true, text: "", image: "", audio: "", isPinned: false }
                        : msg
                ),
            }));
        });

        socket.off("messageReactionUpdated");
        socket.on("messageReactionUpdated", ({ messageId, reactions }) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId
                        ? { ...msg, reactions }
                        : msg
                ),
            }));
        });

        socket.off("messagePinned");
        socket.on("messagePinned", ({ messageId, isPinned }) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId ? { ...msg, isPinned } : msg
                ),
            }));
        });

        socket.off("messageEdited");
        socket.on("messageEdited", ({ messageId, text, isEdited }) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId ? { ...msg, text, isEdited } : msg
                ),
            }));
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        socket.off("newMessage");
        socket.off("messagesRead");
        socket.off("messageRevoked");
        socket.off("messageReactionUpdated");
        socket.off("messagePinned");
        socket.off("messageEdited");
    },

    subscribeToTyping: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.on("typing", (userId) => {
            set((state) => ({ typingUsers: [...new Set([...state.typingUsers, userId])] }));
        });

        socket.on("stop_typing", (userId) => {
            set((state) => ({ typingUsers: state.typingUsers.filter((id) => id !== userId) }));
        });
    },

    unsubscribeFromTyping: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
            socket.off("typing");
            socket.off("stop_typing");
        }
    },
}));