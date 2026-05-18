import { WS_URL } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = {};
    this.isConnected = false;
    this.reconnectTimer = null;
  }

  async connect() {
    const token = await AsyncStorage.getItem('hpms_token');
    const url = token ? `${WS_URL}?token=${token}` : WS_URL;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.isConnected = true;
      this.emit('connection', { connected: true });
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.emit(msg.type, msg.data || msg);
      } catch (err) {}
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this.emit('connection', { connected: false });
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = () => {
      this.ws.close();
    };
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) this.ws.close();
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event, data) {
    const handlers = this.listeners[event];
    if (handlers) {
      handlers.forEach(cb => cb(data));
    }
  }
}

const wsService = new WebSocketService();
export default wsService;
