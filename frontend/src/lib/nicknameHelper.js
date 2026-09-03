export const getDisplayName = (user, authUser) => {
    if (!user) return "";
    if (authUser?.nicknames && user._id) {
        const found = authUser.nicknames.find(
            (n) => n.userId === user._id || n.userId?.toString() === user._id?.toString()
        );
        if (found && found.nickname) {
            return found.nickname;
        }
    }
    return user.fullName || "";
};
