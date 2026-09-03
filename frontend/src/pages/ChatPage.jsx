import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";

import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import SidebarSearch from "../components/SidebarSearch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";

function ChatPage() {
  const { activeTab, selectedUser, subscribeToMessages, unsubscribeFromMessages } = useChatStore();

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [subscribeToMessages, unsubscribeFromMessages]);

  return (
    <div className="w-full h-[100dvh] flex bg-[#0b0f17] text-slate-100 overflow-hidden select-none">
      {/* LEFT SIDEBAR: Hidden on mobile if a user is selected */}
      <div
        className={`${
          selectedUser ? "hidden md:flex" : "flex"
        } w-full md:w-80 lg:w-96 border-r border-slate-800/70 flex-col bg-[#0d121d] h-full flex-none transition-all duration-200`}
      >
        <ProfileHeader />
        <ActiveTabSwitch />
        <SidebarSearch />

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scroll-smooth">
          {activeTab === "chats" ? <ChatsList /> : <ContactList />}
        </div>
      </div>

      {/* RIGHT CHAT AREA: Hidden on mobile if no user is selected */}
      <div
        className={`${
          !selectedUser ? "hidden md:flex" : "flex"
        } flex-1 flex-col h-full bg-[#0b0f17] overflow-hidden relative`}
      >
        {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
      </div>
    </div>
  );
}

export default ChatPage;