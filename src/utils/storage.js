const AUTH_KEY = 'ushare_auth';
const ROOM_KEY = 'ushare_room_key';

export const saveAuthData = (token, roomId, deviceName, role) => {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ token, roomId, deviceName, role }));
};

export const getAuthData = () => {
  const data = localStorage.getItem(AUTH_KEY);
  return data ? JSON.parse(data) : { token: null, roomId: null, deviceName: null, role: null };
};

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('roomId');
  localStorage.removeItem('deviceName');
  localStorage.removeItem('role');
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(ROOM_KEY);
}

export const saveRoomKey = (keyString) => {
  localStorage.setItem(ROOM_KEY, keyString);
}

export const getRoomKey = ()  => {
  return localStorage.getItem(ROOM_KEY);
}
