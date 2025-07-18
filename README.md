# Project Instructions
## Getting Started

Before you begin, ensure you have [Node.js](https://nodejs.org/en/) installed on your system.

### 1. **Navigate to the project directory**:
   ```bash
   cd project-directory
   ```

### 2. **Install dependencies**:
   ```bash
    npm install
    # or
    yarn install # (recommended)
    # or
    pnpm install
    # or
    bun install
   ```

### 3. **Start the development server**:
    ```bash
    npm run dev
    # or
    yarn dev  # (recommended)
    # or
    pnpm dev
    # or
    bun dev
    ```

### 4. **Open your browser** and go to `http://localhost:3000` to see your app.

### 5. **Build for production**:
    ```bash
    npm run build
    # or    
    yarn build  # (recommended)
    # or
    pnpm build
    # or
    bun build
    ```

### 6. **Start the production server**:
    ```bash
    npm run start
    # or
    yarn start  # (recommended)
    # or
    pnpm start
    # or
    bun start
    ```

## Gameplay

### 1. Login as a Player
- Access the game website and authenticate using your preferred method (email, Google, or GitHub)
- New players will have profiles created automatically
- Returning players are directed to their dashboard with game history

### 2. Create or Join a Room
- **Create a Room**:  
  - Click "Create Room" to become the Game Master. The room size is limited to 8 players.
  
- **Join a Room**:
  - Click the Room displays on the main page to join a room.

### 3. Game Setup (Lobby)
- Game Master can:
  - Add/remove AI players to fill spots
  - Start game when all players are ready
- Players can:
  - Chat with others in lobby
  - Change readiness status
  - View assigned role when game starts

### 4. Game Start
- **Role Assignment**:
  - All players receive secret roles via private message
  - The first night phase

### 5. Game Phases
**Night Phase (All players "sleep"):**
- Werewolves: Wake up to select a victim
- Seer: Wakes to investigate one player's role
- Doctor: Chooses a player to protect from elimination
- Other special roles perform actions based on configuration

**Day Phase:**
1. **Announcement**: Game reveals night's events (who died, protected, etc.)
2. **Discussion** (5 minutes):
   - Survivors debate events and suspicions
   - Players defend themselves and accuse others
3. **Voting**:
   - Players vote to eliminate one suspect
   - Tied votes trigger revotes or special rules
4. **Execution**: Voted player reveals role and is eliminated

### 6. Winning Conditions
- **Werewolves win** when they equal or outnumber villagers
- **Villagers win** when all werewolves are eliminated

### 7. Game End
- Full role reveal of all players
- Victory screen shows winning faction
- Options to:
  - Play again with same group
  - Return to lobby
