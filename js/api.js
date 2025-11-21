export async function checkSession() {
    try {
        const response = await fetch('api/auth.php?action=check_session');
        const data = await response.json();
        return data.user || null;
    } catch (e) {
        return null;
    }
}
