import { useState } from 'react';
import { Socket } from 'socket.io-client';

// 用户类型
interface UserType {
  userId: string;
  username: string;
  userAvatar: string;
  isReady: boolean;
  isAI?: boolean;
}

export const useAI = (socket: Socket | null, roomId: string, users: UserType[], roomState: string) => {
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // 检查用户是否是AI
  const isAIUser = (user: UserType): boolean => {
    return Boolean(user.isAI);
  };

  // 模拟从API获取随机AI名字和头像
  const fetchRandomAIProfile = async () => {
    try {
      return new Promise<{name: string, avatar: string}>((resolve) => {
        setTimeout(() => {
          const aiNames = [
            "AI智者", "电子玩家", "数字灵魂", "逻辑思维", "矩阵行者",
            "代码大师", "虚拟玩家", "像素战士", "量子思维", "自动决策",
            "机器智能", "运算高手", "数据分析", "算法精灵", "神经网络"
          ];
          
          const styles = ['bottts', 'pixel-art', 'icons', 'shapes', 'thumbs'];
          const randomStyle = styles[Math.floor(Math.random() * styles.length)];
          const seed = `ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const avatar = `https://api.dicebear.com/9.x/${randomStyle}/png?seed=${seed}`;
          
          const randomName = aiNames[Math.floor(Math.random() * aiNames.length)] + 
                            Math.floor(Math.random() * 100);
          
          resolve({
            name: randomName,
            avatar: avatar
          });
        }, 300);
      });
    } catch (error) {
      console.error("获取AI档案失败:", error);
      return {
        name: `AI玩家${Math.floor(Math.random() * 1000)}`,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=fallback-${Math.floor(Math.random() * 1000)}`
      };
    }
  };

  // 一键填充AI玩家
  const fillWithAI = async () => {
    if (!socket || roomState === 'playing') {
      console.error("无法添加AI玩家");
      return;
    }
    
    try {
      setIsLoadingAI(true);
      const maxPlayers = 8;
      const currentPlayerCount = users.length;
      const aiNeeded = maxPlayers - currentPlayerCount;
      
      if (aiNeeded <= 0) {
        socket.emit('send_msg', {
          roomId,
          message: "房间已满，无需添加AI玩家",
          sender: "系统",
          userId: "system"
        });
        return;
      }
      
      // 生成AI玩家资料
      const aiPlayers = [];
      for (let i = 0; i < aiNeeded; i++) {
        const aiProfile = await fetchRandomAIProfile();
        
        aiPlayers.push({
          userId: `ai-${Date.now()}-${i}`,
          username: aiProfile.name,
          userAvatar: aiProfile.avatar,
          isReady: true, 
          isRoomOwner: false,
          isAI: true
        });
      }
      
      // 发送到服务器
      socket.emit('add_ai_players', {
        roomId,
        aiPlayers
      });
      
    } catch (error) {
      console.error("填充AI失败:", error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  return {
    isLoadingAI,
    fillWithAI,
    isAIUser
  };
};