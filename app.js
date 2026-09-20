// PlaceBets.ai - AI Sports Betting Intelligence

class PlaceBets {
  constructor() {
    this.user = null;
    this.sportsbooks = ['draftkings', 'fanduel', 'betmgm', 'caesars', 'betrivers'];
  }

  async init() {
    console.log('[PlaceBets] Initializing...');
    this.setupEventListeners();
    await this.checkAuth();
    console.log('[PlaceBets] Ready!');
  }

  setupEventListeners() {
    const startBtn = document.querySelector('a[href="#start"]');
    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showSignupModal();
      });
    }
  }

  async checkAuth() {
    const token = localStorage.getItem('pb_token');
    if (token) {
      try {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          this.user = await response.json();
          this.updateUIForUser();
        }
      } catch (error) {
        console.log('[PlaceBets] Not authenticated');
      }
    }
  }

  updateUIForUser() {
    if (this.user) {
      const nav = document.querySelector('.nav-links');
      if (nav) {
        nav.innerHTML = `
          <a href="/dashboard">Dashboard</a>
          <a href="/picks">AI Picks</a>
          <span class="user-name">${this.user.name}</span>
        `;
      }
    }
  }

  showSignupModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Get AI-Powered Picks Free</h2>
        <p>Real-time odds, AI analysis, smart recommendations.</p>
        <form id="signup-form">
          <input type="text" placeholder="Your name" required>
          <input type="email" placeholder="Email address" required>
          <input type="password" placeholder="Password" required>
          <button type="submit" class="btn-primary">Get Free Picks</button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('signup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      await this.signup({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password')
      });
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  async signup(data) {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.token) {
        localStorage.setItem('pb_token', result.token);
        this.user = result.user;
        this.updateUIForUser();
        this.showNotification('Welcome! Check your daily AI picks.');
      }
    } catch (error) {
      this.showNotification('Error creating account', 'error');
    }
  }

  async getAIPicks(sport) {
    if (!this.user) {
      this.showSignupModal();
      return;
    }

    this.showNotification('AI analyzing odds...');

    try {
      const response = await fetch(`/api/picks?sport=${sport}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('pb_token')}` }
      });
      const picks = await response.json();
      return picks;
    } catch (error) {
      this.showNotification('Error getting picks', 'error');
    }
  }

  async compareOdds(gameId) {
    try {
      const response = await fetch(`/api/odds/compare/${gameId}`);
      return await response.json();
    } catch (error) {
      this.showNotification('Error comparing odds', 'error');
    }
  }

  async trackBet(betData) {
    if (!this.user) return;

    try {
      await fetch('/api/bets/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pb_token')}`
        },
        body: JSON.stringify(betData)
      });
      this.showNotification('Bet tracked!');
    } catch (error) {
      this.showNotification('Error tracking bet', 'error');
    }
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.placeBets = new PlaceBets();
  window.placeBets.init();
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlaceBets;
}
