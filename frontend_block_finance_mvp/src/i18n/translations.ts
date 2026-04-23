export type Language = "en" | "ru";

type TranslationValue = string | ((params?: Record<string, string | number>) => string);
type TranslationDictionary = Record<string, TranslationValue>;

function interpolate(
  template: string,
  params: Record<string, string | number> = {}
) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

function formatTranslation(
  value: TranslationValue,
  params?: Record<string, string | number>
) {
  if (typeof value === "function") {
    return value(params);
  }

  return interpolate(value, params);
}

export const translations: Record<Language, TranslationDictionary> = {
  "en": {
    "selectLanguage": "Select Language",
    "selectLanguageDescription": "Choose your preferred language to continue.",
    "continue": "Continue",
    "english": "English",
    "russian": "Русский",

    "language.heroTitle": "Turn everyday payments into game energy.",
    "language.heroSubtitle":
      "Block Finance can now switch the whole interface to your chosen language.",

    "onboarding.badge": "Hackathon MVP Demo",
    "onboarding.quickIntroLabel": "Understand the product in under 8 seconds:",
    "onboarding.quickIntroValue":
      "pay with card -> unlock a reward -> play better instantly.",
    "onboarding.title": "Turn everyday payments into game energy.",
    "onboarding.subtitle":
      "Block Finance makes banking feel rewarding for young users: make a payment, unlock a gameplay boost, and grow progress in one smooth loop.",
    "onboarding.startDemo": "Start 15-sec demo",
    "onboarding.jumpToGame": "Jump into game",
    "onboarding.step1": "1. Pay for coffee",
    "onboarding.step2": "2. Unlock extra move",
    "onboarding.step3": "3. Use it to extend your run",
    "onboarding.firstQuest": "First quest",
    "onboarding.dashboardStartsHere": "Dashboard starts here",
    "onboarding.quest1Title": "Trigger one banking action",
    "onboarding.quest1Copy": "Tap one payment CTA to prove the reward engine is live.",
    "onboarding.quest2Title": "Show progress beyond the reward",
    "onboarding.quest2Copy":
      "The dashboard already shows {paymentsToday}/3 challenge progress and ${savingsCurrent}/${savingsTarget} saved.",
    "onboarding.quest3Title": "Close with the playable proof",
    "onboarding.quest3Copy":
      "Open the puzzle and use the reward as a real gameplay advantage.",
    "onboarding.questLabel": "Quest {index}",
    "onboarding.productLoop": "Product loop",
    "onboarding.loop1Title": "Money becomes momentum",
    "onboarding.loop1Copy": "A simple payment instantly triggers reward logic.",
    "onboarding.loop2Title": "Action becomes reward",
    "onboarding.loop2Copy": "The user receives an extra move for the next session.",
    "onboarding.loop3Title": "Reward becomes progress",
    "onboarding.loop3Copy":
      "Gameplay drives score, XP, and retention-friendly momentum.",
    "onboarding.loopStep": "Step {index}",
    "onboarding.pitchNote":
      "This demo is optimized for a 30-60 second pitch: one payment, one reward, one savings touch, one social hook, and one clear retention story.",

    "dashboard.mobileBadge": "Banking + game loop",
    "dashboard.greeting": "Hi, {name}",
    "dashboard.mobileIntro":
      "Pay with your card, unlock a game reward instantly, then use it to improve the run.",
    "dashboard.todayAtGlance": "Today at a glance",
    "dashboard.threeThings": "Three things matter right now",
    "dashboard.syncing": "Syncing",
    "dashboard.ready": "Ready",
    "dashboard.dailyChallenge": "Daily challenge",
    "dashboard.savingsGoal": "Savings goal",
    "dashboard.rewardStatus": "Reward status",
    "dashboard.locked": "Locked",
    "dashboard.rewardWaiting": "{rewardType} x{rewardValue} is waiting for the next game run.",
    "dashboard.makePaymentToReward": "Make one payment to light up the reward card.",
    "dashboard.howItWorks": "How it works",
    "dashboard.bankDashboard": "Banking dashboard",
    "dashboard.desktopIntro":
      "Card action becomes instant game value. Pay once, unlock an advantage, then carry that momentum into the puzzle and your progress layers.",
    "dashboard.whatHappens": "What happens in 15 seconds",
    "dashboard.whatHappensFlow":
      "Card payment -> reward appears -> savings/referral story is visible -> open game -> use revive",
    "dashboard.cardSpend": "Card spend",
    "dashboard.cashbackReward": "Cashback reward",
    "dashboard.puzzleBoost": "Puzzle boost",
    "dashboard.savingsQuest": "Savings quest",
    "dashboard.profile": "Profile",
    "dashboard.financialProgress": "Financial progress with game energy",
    "dashboard.connected": "Connected",
    "dashboard.level": "Level",
    "dashboard.streak": "Streak",
    "dashboard.daysActive": "Days active",
    "dashboard.xp": "XP",
    "dashboard.toNextLevel": "of {value} to next level",
    "dashboard.xpProgress": "XP progress",
    "dashboard.firstQuest": "First quest",
    "dashboard.proveLoop": "Prove the loop in three taps",
    "dashboard.done": "Done",
    "dashboard.next": "Next",
    "dashboard.triggerAction": "1. Trigger action",
    "dashboard.triggerActionCopy":
      "Tap the payment CTA to simulate a real banking moment.",
    "dashboard.receiveReward": "2. Receive reward",
    "dashboard.receiveRewardCopy":
      "The backend grants an extra move for the next run.",
    "dashboard.playWithPurpose": "3. Play with purpose",
    "dashboard.playWithPurposeCopy":
      "Open the game and convert reward into a better score.",
    "dashboard.make3Payments": "Make 3 card payments today",
    "dashboard.completed": "Completed",
    "dashboard.challengeExplanation":
      "This challenge advances every time the demo payment button is used, so judges can see progression through the existing banking action.",
    "dashboard.challengeCompleteCopy":
      "Challenge complete. Today's habit reward is unlocked and the user sees clear progress momentum.",
    "dashboard.challengePendingCopy":
      "Complete all 3 payments to show a finished habit loop on the dashboard.",
    "dashboard.weekendFund": "Weekend gaming fund",
    "dashboard.savingsExplanation":
      "Simple demo goal: add money manually and show that the same app can turn saving into visible progress.",
    "dashboard.topUpDemo": "Top up in demo mode",
    "dashboard.topUpDemoCopy": "Each top-up adds $5 and grants a small +10 XP bonus.",
    "dashboard.add5": "Add $5",
    "dashboard.activeReward": "Active reward",
    "dashboard.rewardUnlocked": "Reward unlocked",
    "dashboard.rewardDescription":
      "This gives the player one rescue reroll after a dead-end board state.",
    "dashboard.cashbackLive": "Cashback live",
    "dashboard.walletBonus": "Wallet bonus",
    "dashboard.bonusActive": "Bonus active",
    "dashboard.noActiveReward":
      "No active reward yet. Buy coffee to light up this card and carry the bonus into the game.",
    "dashboard.processingPayment": "Processing payment...",
    "dashboard.payForCoffee": "Pay for coffee",
    "dashboard.playGame": "Play game",
    "dashboard.inviteFriend": "Invite a friend",
    "dashboard.referralProgress": "Referral progress",
    "dashboard.invitesCount": "{count}/{target} invites",
    "dashboard.referralCopy":
      "Lightweight social proof for the pitch: invite flow, progress tracking, and a shareable achievement placeholder.",
    "dashboard.demoLink": "Demo link",
    "dashboard.inviteCopied": "Invite link copied. Referral progress updated.",
    "dashboard.inviteSimulated": "Invite action simulated. Referral progress updated.",
    "dashboard.shareCardPlaceholder": "Share card placeholder",
    "dashboard.shareCardTitle": '"Alex saved $40 and unlocked an extra move"',
    "dashboard.shareCardCopy":
      "Ready for social image generation or messaging app sharing in a next iteration.",
    "dashboard.analyticsPulse": "Analytics pulse",
    "dashboard.analyticsCopy":
      "Local analytics events are recorded for demo narration and stored in browser localStorage.",
    "dashboard.analyticsEmpty":
      "Open the app, make a payment, or click invite to populate the event stream.",
    "dashboard.event.app_open": "App opened",
    "dashboard.event.payment_made": "Payment made",
    "dashboard.event.reward_received": "Reward received",
    "dashboard.event.game_started": "Game started",
    "dashboard.event.game_finished": "Game finished",
    "dashboard.event.referral_clicked": "Referral clicked",
    "dashboard.whyItMatters": "Why it matters",
    "dashboard.whyItMattersCopy":
      "The product story is visible on one screen: transaction behavior creates instant motivation, savings stays visible, referral adds a viral surface, and motivation feeds a game loop that can drive habit and loyalty.",
    "dashboard.bonusWallet": "Bonus wallet",
    "dashboard.progressRails": "Progress rails",
    "dashboard.cardToReward": "Card-to-reward",
    "dashboard.savingsBonus": "+10 XP top-up bonus received",

    "game.firstStack": "First stack",
    "game.cleanLane": "Clean lane",
    "game.hotStreak": "Hot streak",
    "game.mtbMode": "MTB mode",
    "game.left": "{value} left",
    "game.backToDashboard": "← Dashboard",
    "game.score": "Score {value}",
    "game.scoreLabel": "Score",
    "game.rewardAvailable": "Reward ×{value}",
    "game.noReward": "No reward",
    "game.runFinished": "Run finished",
    "game.gameOver": "Game Over",
    "game.noPlacements":
      "None of the current 3 pieces can be placed on the board.",
    "game.moves": "Moves",
    "game.extraMovesUsed": "Extra moves used: {value}",
    "game.useExtraMoveReward": "Use extra move reward",
    "game.restart": "Restart",
    "game.saveScoreAndPlayAgain": "Save score and play again",
    "game.saveAndPlayAgainShort": "Save + play again",
    "game.bankScore": "Bank score",
    "game.pickShape": "Pick a shape and tap the board.",
    "game.freshRunStarted": "Fresh run started. Pick a shape and tap the board.",
    "game.noValidPlacements": "No valid placements left. Use reward or bank the run.",
    "game.extraMoveUsed": "Extra move used. New pieces dealt.",
    "game.selectPieceFirst": "Select a piece first",
    "game.pieceDoesNotFit": "That piece does not fit there",
    "game.comboStatus":
      "Combo x{combo}: +{bonus} bonus. Clear {rows} row(s), {cols} column(s).",
    "game.cleanClearStatus": "Clean clear: {rows} row(s), {cols} column(s).",
    "game.placedShape": "Placed {shape} for +{score}.",
    "game.movesCount": "Moves {value}",
    "game.starting": "Starting",
    "game.session": "Session {value}",
    "game.offline": "offline",
    "game.selectAndDragShape": "Select and drag {shape} shape",
    "game.placeSelectedShapeAt":
      "Place selected shape at row {row}, column {col}",

    "error.failedToLoadProfile": "Failed to load profile",
    "error.paymentFailed": "Payment failed",
    "error.failedToStartGame": "Failed to start game",
    "error.failedToSavePreviousRun": "Failed to save previous run",
    "error.failedToRestartGame": "Failed to restart game",
    "error.failedToUseExtraMove": "Failed to use extra move",
    "error.failedToSaveRun": "Failed to save run",
    "error.failedToStartFreshRun": "Failed to start fresh run",
  },
  "ru": {
    "selectLanguage": "Выберите язык",
    "selectLanguageDescription": "Выберите удобный язык интерфейса, чтобы продолжить.",
    "continue": "Продолжить",
    "english": "English",
    "russian": "Русский",

    "language.heroTitle": "Превратите повседневные платежи в игровую энергию.",
    "language.heroSubtitle":
      "Теперь Block Finance может переключать весь интерфейс на выбранный вами язык.",

    "onboarding.badge": "Демо Hackathon MVP",
    "onboarding.quickIntroLabel": "Поймите продукт меньше чем за 8 секунд:",
    "onboarding.quickIntroValue":
      "оплатите картой -> получите награду -> играйте лучше сразу.",
    "onboarding.title": "Превратите повседневные платежи в игровую энергию.",
    "onboarding.subtitle":
      "Block Finance делает банковский опыт более увлекательным для молодых пользователей: совершите платёж, получите игровой буст и растите прогресс в одном плавном цикле.",
    "onboarding.startDemo": "Запустить 15-сек. демо",
    "onboarding.jumpToGame": "Сразу в игру",
    "onboarding.step1": "1. Оплатить кофе",
    "onboarding.step2": "2. Получить доп. ход",
    "onboarding.step3": "3. Использовать его, чтобы продлить забег",
    "onboarding.firstQuest": "Первый квест",
    "onboarding.dashboardStartsHere": "С этого начинается дашборд",
    "onboarding.quest1Title": "Запустите одно банковское действие",
    "onboarding.quest1Copy":
      "Нажмите на CTA оплаты, чтобы показать, что движок наград работает.",
    "onboarding.quest2Title": "Покажите прогресс помимо награды",
    "onboarding.quest2Copy":
      "На дашборде уже видно прогресс челленджа {paymentsToday}/3 и накопления ${savingsCurrent}/${savingsTarget}.",
    "onboarding.quest3Title": "Завершите демонстрацию играбельным доказательством",
    "onboarding.quest3Copy":
      "Откройте головоломку и используйте награду как реальное игровое преимущество.",
    "onboarding.questLabel": "Квест {index}",
    "onboarding.productLoop": "Продуктовый цикл",
    "onboarding.loop1Title": "Деньги превращаются в импульс",
    "onboarding.loop1Copy":
      "Простой платёж мгновенно запускает механику награды.",
    "onboarding.loop2Title": "Действие превращается в награду",
    "onboarding.loop2Copy":
      "Пользователь получает дополнительный ход на следующую сессию.",
    "onboarding.loop3Title": "Награда превращается в прогресс",
    "onboarding.loop3Copy":
      "Геймплей двигает счёт, XP и удерживающий импульс продукта.",
    "onboarding.loopStep": "Шаг {index}",
    "onboarding.pitchNote":
      "Это демо оптимизировано под питч на 30-60 секунд: один платёж, одна награда, одно касание накоплений, один социальный крючок и одна ясная история про удержание.",

    "dashboard.mobileBadge": "Банк + игровой цикл",
    "dashboard.greeting": "Привет, {name}",
    "dashboard.mobileIntro":
      "Платите картой, мгновенно получайте игровую награду и используйте её, чтобы улучшить забег.",
    "dashboard.todayAtGlance": "Сегодня в одном экране",
    "dashboard.threeThings": "Сейчас важны три вещи",
    "dashboard.syncing": "Синхронизация",
    "dashboard.ready": "Готово",
    "dashboard.dailyChallenge": "Ежедневный челлендж",
    "dashboard.savingsGoal": "Цель накоплений",
    "dashboard.rewardStatus": "Статус награды",
    "dashboard.locked": "Закрыто",
    "dashboard.rewardWaiting":
      "{rewardType} x{rewardValue} ждёт следующего игрового забега.",
    "dashboard.makePaymentToReward":
      "Сделайте один платёж, чтобы активировать карточку награды.",
    "dashboard.howItWorks": "Как это работает",
    "dashboard.bankDashboard": "Банковский дашборд",
    "dashboard.desktopIntro":
      "Действие по карте мгновенно превращается в игровую ценность. Один платёж открывает преимущество, которое затем переносится в головоломку и слои прогресса.",
    "dashboard.whatHappens": "Что происходит за 15 секунд",
    "dashboard.whatHappensFlow":
      "Оплата картой -> появляется награда -> виден сюжет про накопления/рефералов -> открыть игру -> использовать спасение",
    "dashboard.cardSpend": "Платёж картой",
    "dashboard.cashbackReward": "Награда-кэшбэк",
    "dashboard.puzzleBoost": "Буст для пазла",
    "dashboard.savingsQuest": "Квест накоплений",
    "dashboard.profile": "Профиль",
    "dashboard.financialProgress": "Финансовый прогресс с игровой энергией",
    "dashboard.connected": "Подключено",
    "dashboard.level": "Уровень",
    "dashboard.streak": "Серия",
    "dashboard.daysActive": "Дней активности",
    "dashboard.xp": "XP",
    "dashboard.toNextLevel": "из {value} до следующего уровня",
    "dashboard.xpProgress": "Прогресс XP",
    "dashboard.firstQuest": "Первый квест",
    "dashboard.proveLoop": "Докажите цикл за три нажатия",
    "dashboard.done": "Готово",
    "dashboard.next": "Дальше",
    "dashboard.triggerAction": "1. Запустить действие",
    "dashboard.triggerActionCopy":
      "Нажмите на CTA оплаты, чтобы симулировать реальный банковский момент.",
    "dashboard.receiveReward": "2. Получить награду",
    "dashboard.receiveRewardCopy":
      "Бэкенд выдаёт дополнительный ход на следующий забег.",
    "dashboard.playWithPurpose": "3. Играть с выгодой",
    "dashboard.playWithPurposeCopy":
      "Откройте игру и превратите награду в более высокий счёт.",
    "dashboard.make3Payments": "Сделайте 3 платежа картой сегодня",
    "dashboard.completed": "Выполнено",
    "dashboard.challengeExplanation":
      "Этот челлендж продвигается каждый раз, когда используется демо-кнопка оплаты, поэтому жюри видит прогрессию через существующее банковское действие.",
    "dashboard.challengeCompleteCopy":
      "Челлендж завершён. Сегодняшняя награда за привычку разблокирована, и пользователь видит явный импульс прогресса.",
    "dashboard.challengePendingCopy":
      "Завершите все 3 платежа, чтобы показать законченный цикл привычки на дашборде.",
    "dashboard.weekendFund": "Фонд игр на выходные",
    "dashboard.savingsExplanation":
      "Простая цель для демо: вручную добавляйте деньги и показывайте, что то же приложение может превращать накопления в видимый прогресс.",
    "dashboard.topUpDemo": "Пополнение в демо-режиме",
    "dashboard.topUpDemoCopy":
      "Каждое пополнение добавляет $5 и даёт небольшой бонус +10 XP.",
    "dashboard.add5": "Добавить $5",
    "dashboard.activeReward": "Активная награда",
    "dashboard.rewardUnlocked": "Награда открыта",
    "dashboard.rewardDescription":
      "Это даёт игроку один спасательный реролл после тупиковой ситуации на поле.",
    "dashboard.cashbackLive": "Кэшбэк активен",
    "dashboard.walletBonus": "Бонус кошелька",
    "dashboard.bonusActive": "Бонус активен",
    "dashboard.noActiveReward":
      "Пока нет активной награды. Купите кофе, чтобы зажечь эту карточку и перенести бонус в игру.",
    "dashboard.processingPayment": "Обработка платежа...",
    "dashboard.payForCoffee": "Оплатить кофе",
    "dashboard.playGame": "Играть",
    "dashboard.inviteFriend": "Пригласить друга",
    "dashboard.referralProgress": "Реферальный прогресс",
    "dashboard.invitesCount": "{count}/{target} приглашений",
    "dashboard.referralCopy":
      "Лёгкое социальное доказательство для питча: инвайт-флоу, отслеживание прогресса и заготовка под шаринг достижения.",
    "dashboard.demoLink": "Демо-ссылка",
    "dashboard.inviteCopied": "Ссылка приглашения скопирована. Реферальный прогресс обновлён.",
    "dashboard.inviteSimulated":
      "Действие приглашения симулировано. Реферальный прогресс обновлён.",
    "dashboard.shareCardPlaceholder": "Заглушка для шаринг-карточки",
    "dashboard.shareCardTitle": '"Alex накопил $40 и открыл дополнительный ход"',
    "dashboard.shareCardCopy":
      "Готово для генерации соцкартинки или отправки в мессенджер на следующей итерации.",
    "dashboard.analyticsPulse": "Пульс аналитики",
    "dashboard.analyticsCopy":
      "Локальные события аналитики записываются для демо-озвучки и хранятся в `localStorage` браузера.",
    "dashboard.analyticsEmpty":
      "Откройте приложение, сделайте платёж или нажмите приглашение, чтобы заполнить поток событий.",
    "dashboard.event.app_open": "Приложение открыто",
    "dashboard.event.payment_made": "Платёж выполнен",
    "dashboard.event.reward_received": "Награда получена",
    "dashboard.event.game_started": "Игра начата",
    "dashboard.event.game_finished": "Игра завершена",
    "dashboard.event.referral_clicked": "Нажато приглашение",
    "dashboard.whyItMatters": "Почему это важно",
    "dashboard.whyItMattersCopy":
      "История продукта видна на одном экране: транзакционное поведение создаёт мгновенную мотивацию, накопления остаются заметными, рефералы добавляют вирусную поверхность, а мотивация питает игровой цикл, который может усиливать привычку и лояльность.",
    "dashboard.bonusWallet": "Бонусный кошелёк",
    "dashboard.progressRails": "Рельсы прогресса",
    "dashboard.cardToReward": "Карта-в-награду",
    "dashboard.savingsBonus": "+10 XP бонуса за пополнение",

    "game.firstStack": "Первый стек",
    "game.cleanLane": "Чистая линия",
    "game.hotStreak": "Горячая серия",
    "game.mtbMode": "Режим MTB",
    "game.left": "ещё {value}",
    "game.backToDashboard": "← Дашборд",
    "game.score": "Счёт {value}",
    "game.scoreLabel": "Счёт",
    "game.rewardAvailable": "Награда ×{value}",
    "game.noReward": "Нет награды",
    "game.runFinished": "Забег завершён",
    "game.gameOver": "Игра окончена",
    "game.noPlacements":
      "Ни одну из текущих 3 фигур нельзя поставить на поле.",
    "game.moves": "Ходы",
    "game.extraMovesUsed": "Доп. ходов использовано: {value}",
    "game.useExtraMoveReward": "Использовать награду доп. хода",
    "game.restart": "Начать заново",
    "game.saveScoreAndPlayAgain": "Сохранить счёт и играть снова",
    "game.saveAndPlayAgainShort": "Сохранить и снова",
    "game.bankScore": "Сохранить счёт",
    "game.pickShape": "Выберите фигуру и нажмите на поле.",
    "game.freshRunStarted": "Новый забег начат. Выберите фигуру и нажмите на поле.",
    "game.noValidPlacements":
      "Больше нет доступных размещений. Используйте награду или сохраните забег.",
    "game.extraMoveUsed": "Дополнительный ход использован. Новые фигуры выданы.",
    "game.selectPieceFirst": "Сначала выберите фигуру",
    "game.pieceDoesNotFit": "Эта фигура сюда не помещается",
    "game.comboStatus":
      "Комбо x{combo}: +{bonus} бонуса. Очищено рядов: {rows}, колонок: {cols}.",
    "game.cleanClearStatus":
      "Чистая очистка: рядов {rows}, колонок {cols}.",
    "game.placedShape": "Фигура {shape} размещена на +{score}.",
    "game.movesCount": "Ходы {value}",
    "game.starting": "Запуск",
    "game.session": "Сессия {value}",
    "game.offline": "офлайн",
    "game.selectAndDragShape": "Выбрать и перетащить фигуру {shape}",
    "game.placeSelectedShapeAt":
      "Поставить выбранную фигуру в ряд {row}, колонку {col}",

    "error.failedToLoadProfile": "Не удалось загрузить профиль",
    "error.paymentFailed": "Платёж не выполнен",
    "error.failedToStartGame": "Не удалось запустить игру",
    "error.failedToSavePreviousRun": "Не удалось сохранить предыдущий забег",
    "error.failedToRestartGame": "Не удалось перезапустить игру",
    "error.failedToUseExtraMove": "Не удалось использовать дополнительный ход",
    "error.failedToSaveRun": "Не удалось сохранить забег",
    "error.failedToStartFreshRun": "Не удалось начать новый забег",
  },
};

export function t(
  key: string,
  language: Language,
  params?: Record<string, string | number>
): string {
  const dictionary = translations[language] ?? translations.en;
  const fallback = translations.en[key];
  const value = dictionary[key] ?? fallback;

  if (!value) {
    return key;
  }

  return formatTranslation(value, params);
}
