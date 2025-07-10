// components/game/GameActions.tsx
import React, { useState, useEffect } from 'react';
import { useRoomContext } from '@/contexts/ChatContext';

const GameActions: React.FC = () => {
  const {
    nightActionRequired,
    voteRequired,
    hunterSkillRequired,
    users,
    playerVote,
    werewolfVote,
    seerCheck,
    witchAction,
    hunterShoot,
    skipAction,
    seerResult,
    currentVoteStats
  } = useRoomContext();

  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // 倒计时处理
  useEffect(() => {
    const actionData = nightActionRequired || voteRequired || hunterSkillRequired;
    if (!actionData) return;

    const timeLimit = actionData.timeLimit || 60000;
    setTimeLeft(Math.floor(timeLimit / 1000));

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSkip();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nightActionRequired, voteRequired, hunterSkillRequired]);

  const handleSkip = () => {
    if (nightActionRequired) {
      skipAction(nightActionRequired.action);
    } else if (voteRequired) {
      skipAction('vote');
    } else if (hunterSkillRequired) {
      skipAction('hunter');
    }
  };

  const handleAction = () => {
    if (!selectedTarget) return;

    if (nightActionRequired) {
      switch (nightActionRequired.action) {
        case 'werewolf_kill':
          werewolfVote(selectedTarget);
          break;
        case 'seer_check':
          seerCheck(selectedTarget);
          break;
      }
    } else if (voteRequired) {
      playerVote(selectedTarget);
    } else if (hunterSkillRequired) {
      hunterShoot(selectedTarget);
    }

    setSelectedTarget('');
  };

  const renderVoteStats = () => {
    if (!currentVoteStats || !voteRequired) return null;

    const { voteResults, totalVotes, alivePlayers } = currentVoteStats;
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
        <h4 className="font-medium text-blue-800 mb-2">
          📊 实时投票统计 ({totalVotes}/{alivePlayers})
        </h4>
        <div className="space-y-1">
          {Object.entries(voteResults).map(([targetId, data]) => {
            const target = users.find(u => u.userId === targetId);
            return (
              <div key={targetId} className="flex justify-between text-sm">
                <span>{target?.username || '未知'}</span>
                <span className="font-medium">{data.count}票</span>
              </div>
            );
          })}
          {Object.keys(voteResults).length === 0 && (
            <div className="text-gray-500 text-sm">暂无投票</div>
          )}
        </div>
      </div>
    );
  };

  const renderNightAction = () => {
    if (!nightActionRequired) return null;

    const { action, targets, message, hasAntidote, hasPoison, deadPlayer, alivePlayers } = nightActionRequired;

    if (action === 'witch_action') {
      return (
        <div className="bg-purple-100 border border-purple-300 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-purple-800 mb-3">
            🧙‍♀️ 女巫行动 (剩余时间: {timeLeft}s)
          </h3>
          <p className="text-purple-700 mb-4">{message}</p>
          
          <div className="space-y-3">
            {/* 解药选项 */}
            {hasAntidote && deadPlayer && (
              <div className="bg-white p-3 rounded border">
                <h4 className="font-medium text-green-700 mb-2">💊 使用解药</h4>
                <p className="text-sm text-gray-600 mb-2">
                  {deadPlayer.username} 被击杀，是否使用解药救活？
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => witchAction('save', deadPlayer.userId)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    使用解药
                  </button>
                </div>
              </div>
            )}

            {/* 毒药选项 */}
            {hasPoison && alivePlayers && (
              <div className="bg-white p-3 rounded border">
                <h4 className="font-medium text-red-700 mb-2">☠️ 使用毒药</h4>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full p-2 border rounded mb-2"
                >
                  <option value="">选择要毒杀的目标...</option>
                  {alivePlayers.map(player => (
                    <option key={player.userId} value={player.userId}>
                      {player.username} ({player.position}号位)
                    </option>
                  ))}
                </select>
                {selectedTarget && (
                  <button
                    onClick={() => witchAction('poison', selectedTarget)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    使用毒药
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handleSkip}
              className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
            >
              跳过行动
            </button>
          </div>
        </div>
      );
    }

    // 其他夜间行动（狼人击杀、预言家查验）
    return (
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">
          {action === 'werewolf_kill' ? '🐺 狼人击杀' : '👁️ 预言家查验'} 
          (剩余时间: {timeLeft}s)
        </h3>
        <p className="text-gray-700 mb-4">{message}</p>
        
        <select
          value={selectedTarget}
          onChange={(e) => setSelectedTarget(e.target.value)}
          className="w-full p-2 border rounded mb-3"
        >
          <option value="">选择目标...</option>
          {targets?.map(target => (
            <option key={target.userId} value={target.userId}>
              {target.username} ({target.position}号位)
            </option>
          ))}
        </select>
        
        <div className="flex gap-2">
          <button
            onClick={handleAction}
            disabled={!selectedTarget}
            className={`flex-1 py-2 rounded text-white ${
              selectedTarget 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            确认行动
          </button>
          <button
            onClick={handleSkip}
            className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
          >
            跳过
          </button>
        </div>
      </div>
    );
  };

  // 渲染投票界面
  const renderVoteAction = () => {
    if (!voteRequired) return null;

    const { phase, targets, message } = voteRequired;
    console.log('渲染投票界面:', phase, targets, message);
    return (
      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">
          🗳️ 投票淘汰 (剩余时间: {timeLeft}s)
        </h3>
        <p className="text-yellow-700 mb-4">{message}</p>
        
        {renderVoteStats()}
        
        <select
          value={selectedTarget}
          onChange={(e) => setSelectedTarget(e.target.value)}
          className="w-full p-2 border rounded mb-3"
        >
          <option value="">选择投票目标...</option>
          {targets.map(target => (
            <option key={target.userId} value={target.userId}>
              {target.username} ({target.position}号位)
            </option>
          ))}
        </select>
        
        <div className="flex gap-2">
          <button
            onClick={handleAction}
            disabled={!selectedTarget}
            className={`flex-1 py-2 rounded text-white ${
              selectedTarget 
                ? 'bg-yellow-500 hover:bg-yellow-600' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            投票
          </button>
          <button
            onClick={handleSkip}
            className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
          >
            弃票
          </button>
        </div>
      </div>
    );
  };

  const renderHunterAction = () => {
    if (!hunterSkillRequired) return null;

    const { targets, message } = hunterSkillRequired;

    return (
      <div className="bg-red-100 border border-red-300 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-800 mb-3">
          🏹 猎人技能 (剩余时间: {timeLeft}s)
        </h3>
        <p className="text-red-700 mb-4">{message}</p>
        
        <select
          value={selectedTarget}
          onChange={(e) => setSelectedTarget(e.target.value)}
          className="w-full p-2 border rounded mb-3"
        >
          <option value="">选择要带走的目标...</option>
          {targets.map(target => (
            <option key={target.userId} value={target.userId}>
              {target.username} ({target.position}号位)
            </option>
          ))}
        </select>
        
        <div className="flex gap-2">
          <button
            onClick={handleAction}
            disabled={!selectedTarget}
            className={`flex-1 py-2 rounded text-white ${
              selectedTarget 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            带走
          </button>
          <button
            onClick={handleSkip}
            className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
          >
            放弃
          </button>
        </div>
      </div>
    );
  };

  const renderSeerResult = () => {
    if (!seerResult) return null;

    return (
      <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">👁️ 查验结果</h3>
        <p className="text-blue-700">
          {seerResult.target} ({seerResult.position}号位) 的身份是: 
          <span className={`font-bold ml-2 ${seerResult.isWerewolf ? 'text-red-600' : 'text-green-600'}`}>
            {seerResult.result}
          </span>
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderSeerResult()}
      {renderNightAction()}
      {renderVoteAction()}
      {renderHunterAction()}
    </div>
  );
};

export default GameActions;