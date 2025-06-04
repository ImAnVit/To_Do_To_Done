type EventCallback = (data: any) => void;

class EventBus {
  private events: { [key: string]: EventCallback[] };

  constructor() {
    this.events = {};
  }

  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event: string, data: any) {
    const callbacks = this.events[event];
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events[event];
    if (callbacks) {
      this.events[event] = callbacks.filter(cb => cb !== callback);
    }
  }
}

const eventBus = new EventBus();
export default eventBus; 