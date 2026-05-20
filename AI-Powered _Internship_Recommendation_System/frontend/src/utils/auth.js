export function getRoleFromUser(user) {
    return user?.role || null;
}

export function roleToHome(role) {
    switch (role) {
        case "SUPER_ADMIN":
            return "/super-admin";
        case "UNIVERSITY":
            return "/university";
        case "ORGANIZATION":
            return "/organization";
        case "STUDENT":
            return "/student";
        default:
            return "/";
    }
}
