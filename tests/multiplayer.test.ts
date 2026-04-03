import { test, expect, Page, BrowserContext } from '@playwright/test';

const GAME_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

async function openGame(page: Page) {
  await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('input').first()).toBeVisible({ timeout: 30000 });
}

async function createAndJoinRoom(page1: Page, page2: Page, options?: { asObserver?: boolean }) {
  const asObserver = options?.asObserver ?? false;
  await openGame(page1);
  await openGame(page2);

  await page1.locator('input').first().fill('玩家1');
  await page2.locator('input').first().fill('玩家2');

  await page1.getByRole('button', { name: /创建房间/ }).click();
  await expect(page1.getByRole('button', { name: /房间: [A-Z0-9]{6,8}/ })).toBeVisible({ timeout: 15000 });
  const roomLabel = page1.getByText(/房间: [A-Z0-9]{6,8}/).first();
  await expect(roomLabel).toBeVisible({ timeout: 15000 });
  const roomText = await roomLabel.textContent();
  const roomId = roomText?.match(/[A-Z0-9]{6,8}/)?.[0] || '';

  const joinRoomButton = page2.getByRole('button', { name: /加入房间/ });
  if (await joinRoomButton.count() > 0) {
    await joinRoomButton.click();
    await page2.waitForTimeout(500);

    const dialogInput = page2.locator('[role="dialog"] input');
    if (await dialogInput.count() > 0) {
      await dialogInput.fill(roomId);
      const joinActionButton = page2.getByRole('button', { name: asObserver ? /旁观/ : /加入游戏|加入/ });
      await joinActionButton.last().click();
    }
  } else {
    const joinFromLobbyButton = page2.getByRole('button', { name: asObserver ? /旁观/ : /参加游戏/ }).first();
    await expect(joinFromLobbyButton).toBeVisible({ timeout: 15000 });
    await joinFromLobbyButton.click();
  }

  await expect(page1.getByRole('button', { name: /回到大厅/ })).toBeVisible({ timeout: 15000 });
  await expect(page2.getByRole('button', { name: /回到大厅/ })).toBeVisible({ timeout: 15000 });
  const readyButton = page2.getByRole('button', { name: /准备|取消准备/ });
  if (!asObserver && await readyButton.count() > 0) {
    await readyButton.click();
    await page1.waitForTimeout(1000);
  }
  return { roomId };
}

test.describe('二次元歌牌 2.0 测试', () => {
  test.setTimeout(120000);

  test('基础游戏流程测试', async ({ browser }) => {
    console.log('=== 开始基础游戏流程测试 ===');
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await openGame(page);
    
    console.log('页面加载完成');
    
    const titleVisible = await page.locator('text=二次元歌牌').count();
    expect(titleVisible).toBeGreaterThan(0);
    console.log('标题显示正常');
    
    const nameInput = page.locator('input').first();
    await nameInput.fill('测试玩家');
    console.log('输入玩家名称');
    
    const createButton = page.getByRole('button', { name: /创建房间/ });
    await createButton.click();
    console.log('点击创建房间');
    
    await expect(page.getByRole('button', { name: /房间: [A-Z0-9]{6,8}/ })).toBeVisible({ timeout: 15000 });
    console.log('房间创建成功');
    
    const startButton = page.getByRole('button', { name: /开始游戏/ });
    await startButton.click();
    console.log('点击开始游戏');
    
    await page.waitForTimeout(3000);
    
    const gameStarted = await page.locator('text=/🎵|倒计时/').count();
    console.log(`游戏状态: ${gameStarted > 0 ? '已开始' : '未开始'}`);
    
    const cards = await page.locator('[class*="card"]').count();
    console.log(`卡牌数量: ${cards}`);
    
    if (cards > 0) {
      await page.locator('[class*="card"]').first().click();
      console.log('点击第一张卡牌');
      await page.waitForTimeout(2000);
    }
    
    await context.close();
    console.log('=== 基础测试完成 ===');
  });

  test('2026年新番数据验证', async ({ browser }) => {
    console.log('=== 开始新番数据验证 ===');
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await openGame(page);
    
    const nameInput = page.locator('input').first();
    await nameInput.fill('数据验证者');
    
    const createButton = page.getByRole('button', { name: /创建房间/ });
    await createButton.click();
    
    await page.waitForTimeout(2000);
    
    const animeListVisible = await page.locator('text=2026年新番').count();
    expect(animeListVisible).toBeGreaterThan(0);
    console.log('2026年新番牌组标题显示正常');
    
    const coverImages = await page.locator('[style*="background"][style*="url"]').count();
    console.log(`封面图数量: ${coverImages}`);
    
    await context.close();
    console.log('=== 数据验证完成 ===');
  });

  test('裁判模式暂停功能测试', async ({ browser }) => {
    console.log('=== 开始暂停功能测试 ===');
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await openGame(page);
    
    const nameInput = page.locator('input').first();
    await nameInput.fill('裁判');
    
    const createButton = page.getByRole('button', { name: /创建房间/ });
    await createButton.click();
    
    await page.waitForTimeout(1000);
    
    const judgeButton = page.getByRole('button', { name: /裁判模式/ });
    await judgeButton.click();
    console.log('选择裁判模式');
    
    await page.waitForTimeout(500);
    
    const startButton = page.getByRole('button', { name: /开始游戏/ });
    await startButton.click();
    console.log('开始游戏');
    
    await page.waitForTimeout(3000);
    
    const pauseButton = page.getByRole('button').filter({ has: page.locator('svg') }).first();
    const pauseButtonCount = await pauseButton.count();
    
    if (pauseButtonCount > 0) {
      await pauseButton.click();
      console.log('点击暂停按钮');
      
      await page.waitForTimeout(1000);
      
      const pauseOverlay = await page.locator('text=游戏已暂停').count();
      console.log(`暂停遮罩: ${pauseOverlay > 0 ? '显示' : '未显示'}`);
      
      if (pauseOverlay > 0) {
        console.log('暂停功能正常');
      }
    } else {
      console.log('暂停按钮未找到，可能游戏未正确开始');
    }
    
    await context.close();
    console.log('=== 暂停功能测试完成 ===');
  });

  test('多人模拟测试 (2人)', async ({ browser }) => {
    console.log('=== 开始2人模拟测试 ===');
    
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    const { roomId } = await createAndJoinRoom(page1, page2);
    console.log(`房间号: ${roomId}`);
    
    await page1.waitForTimeout(2000);
    console.log('玩家2已加入房间');
    
    const playerCount = await page1.locator('text=/玩家 \\(2\\/8\\)/').count();
    console.log(`玩家数量显示: ${playerCount > 0 ? '正确' : '需要检查'}`);
    
    await page1.getByRole('button', { name: /开始游戏/ }).click();
    console.log('开始游戏');
    
    await page1.waitForTimeout(3000);
    
    const cards1 = await page1.locator('[class*="card"]').count();
    const cards2 = await page2.locator('[class*="card"]').count();
    
    console.log(`玩家1卡牌: ${cards1}, 玩家2卡牌: ${cards2}`);
    
    if (cards1 > 0 && cards2 > 0) {
      await page1.locator('[class*="card"]').first().click();
      await page2.locator('[class*="card"]').last().click();
      console.log('两个玩家各点击一张卡牌');
      
      await page1.waitForTimeout(2000);
    }
    
    await context1.close();
    await context2.close();
    console.log('=== 2人模拟测试完成 ===');
  });

  test('聊天与选牌同步测试', async ({ browser }) => {
    console.log('=== 开始聊天与选牌同步测试 ===');

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await createAndJoinRoom(page1, page2, { asObserver: true });
    await expect(page1.getByRole('button', { name: /回到大厅/ })).toBeVisible({ timeout: 15000 });
    await expect(page2.getByRole('button', { name: /回到大厅/ })).toBeVisible({ timeout: 15000 });

    const chatInput1 = page1.getByTestId('chat-input');
    await chatInput1.fill('你好，能看到这条消息吗？');
    await chatInput1.press('Enter');

    await expect(page1.getByTestId('chat-messages')).toContainText('你好，能看到这条消息吗？', { timeout: 15000 });
    await expect(page2.getByTestId('chat-messages')).toContainText('你好，能看到这条消息吗？', { timeout: 15000 });
    await expect(page2.getByTestId('chat-messages')).toContainText('玩家1', { timeout: 15000 });
    console.log('聊天广播正常');

    await page1.getByRole('button', { name: /开始游戏/ }).click();
    await page1.waitForTimeout(3000);

    const firstCard = page1.locator('[class*="card"]').first();
    await firstCard.click();

    await expect(page1.getByTestId('turn-picks-panel')).toBeVisible({ timeout: 15000 });
    await expect(page2.getByTestId('turn-picks-panel')).toBeVisible({ timeout: 15000 });
    await expect(page2.getByTestId('turn-picks-panel')).toContainText('玩家1', { timeout: 15000 });
    await expect(page2.getByTestId('turn-pick-chip')).toHaveCount(1, { timeout: 15000 });
    console.log('选牌可见性正常');

    await context1.close();
    await context2.close();
    console.log('=== 聊天与选牌同步测试完成 ===');
  });

  test('大厅房间列表测试', async ({ browser }) => {
    console.log('=== 开始大厅房间列表测试 ===');
    
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    await openGame(page1);
    await openGame(page2);
    
    await page1.locator('input').first().fill('房主');
    await page1.getByRole('button', { name: /创建房间/ }).click();
    
    await page1.waitForTimeout(2000);
    
    await openGame(page2);
    
    await page2.waitForTimeout(3000);
    
    const roomsListVisible = await page2.locator('text=游戏大厅').count();
    console.log(`大厅标题: ${roomsListVisible > 0 ? '显示' : '未显示'}`);
    
    const roomCardVisible = await page2.locator('text=/准备中|游戏中/').count();
    console.log(`房间卡片: ${roomCardVisible > 0 ? '显示' : '未显示'}`);
    
    if (roomCardVisible > 0) {
      const joinButton = page2.getByRole('button', { name: /参加游戏/ });
      if (await joinButton.count() > 0) {
        console.log('找到参加游戏按钮');
      }
    }
    
    const leaveButton = page1.getByRole('button', { name: /回到大厅/ });
    if (await leaveButton.count() > 0) {
      await leaveButton.click();
      console.log('点击回到大厅按钮');
      
      await page1.waitForTimeout(1000);
      
      const lobbyVisible = await page1.locator('text=游戏大厅').count();
      console.log(`返回大厅: ${lobbyVisible > 0 ? '成功' : '失败'}`);
    }
    
    await context1.close();
    await context2.close();
    console.log('=== 大厅房间列表测试完成 ===');
  });

  test('牌组选择功能测试', async ({ browser }) => {
    console.log('=== 开始牌组选择功能测试 ===');
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await openGame(page);
    
    const deckSelectionVisible = await page.locator('text=选择牌组').count();
    console.log(`牌组选择: ${deckSelectionVisible > 0 ? '显示' : '未显示'}`);
    
    if (deckSelectionVisible > 0) {
      const anime2026Deck = page.locator('text=2026年新番');
      const customDeck = page.locator('text=自定义牌组');
      
      console.log(`2026新番选项: ${await anime2026Deck.count() > 0 ? '存在' : '不存在'}`);
      console.log(`自定义牌组选项: ${await customDeck.count() > 0 ? '存在' : '不存在'}`);
      
      await customDeck.click();
      console.log('选择自定义牌组');
      
      await page.waitForTimeout(500);
      
      await page.locator('input').first().fill('牌组测试者');
      await page.getByRole('button', { name: /创建房间/ }).click();
      
      await page.waitForTimeout(2000);
      
      const customCardUploader = await page.locator('text=自定义歌牌上传').count();
      console.log(`自定义卡牌上传区: ${customCardUploader > 0 ? '显示' : '未显示'}`);
    }
    
    await context.close();
    console.log('=== 牌组选择功能测试完成 ===');
  });
});
