export const saveAuthData = (token, roomId, deviceName, role) => {
    localStorage.setItem('ushare_token', token);
    localStorage.setItem('ushare_roomId', roomId);
    localStorage.setItem('ushare_deviceName', deviceName);
    localStorage.setItem('ushare_role', role);
};

export const getAuthData = () => {
    return {
        token: localStorage.getItem('ushare_token'),
        roomId: localStorage.getItem('ushare_roomId'),
        deviceName: localStorage.getItem('ushare_deviceName'),
        role: localStorage.getItem('ushare_role')
    };
};

export const clearAuthData = () => {
    localStorage.removeItem('ushare_token');
    localStorage.removeItem('ushare_roomId');
    localStorage.removeItem('ushare_deviceName');
    localStorage.removeItem('ushare_role');
}