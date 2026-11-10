export const yapTopics = [
  "Why pineapple on pizza is a crime.",
  "If animals could talk, which one would be the rudest?",
  "Why should Mondays be abolished?",
  "If you became famous tomorrow, what would it be for?",
  "Why is everyone’s phone battery always low?",
  "Convince everyone that naps should be a legal right.",
  "Would you survive a zombie apocalypse?",
  "Is texting ‘K’ an act of violence?",
  "If your life had a narrator, who would you choose?",
  "Which fictional character would be the worst roommate?",
  "Why should attendance be optional?",
  "What would happen if humans had a 48-hour day?",
  "Defend wearing pyjamas to every formal event.",
  "Which food deserves its own national holiday?",
  "Convince the group that aliens already use the group chat.",
  "What is the most suspicious thing about pigeons?",
  "Why should every meeting be replaced with a dance battle?",
  "Which tiny inconvenience would make the worst supervillain origin story?",
  "If your phone could expose one secret, what would it reveal?",
  "Pitch the worst theme park anyone would still visit.",
  "What would your pet name you if it owned you?",
  "Which emoji should be removed from society forever?",
  "Explain why breakfast for dinner is peak civilisation.",
  "If sleep were a competitive sport, who here would win?",
  "Invent a new law that would make weekends better.",
  "Which app would be the most dramatic person at a party?",
  "Sell the group a holiday on the moon.",
  "Why is choosing where to eat harder than rocket science?",
  "Which household object is secretly judging us?",
  "What is the correct number of alarms to set in the morning?",
];

export function pickTopic(
  recent: string[],
  random: () => number = Math.random,
) {
  const fresh = yapTopics.filter((topic) => !recent.includes(topic));
  const pool = fresh.length ? fresh : yapTopics;
  return pool[Math.floor(random() * pool.length)];
}

export function secondsRemaining(deadline: number, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
