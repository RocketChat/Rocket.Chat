module.export({durationSecond:()=>durationSecond,durationMinute:()=>durationMinute,durationHour:()=>durationHour,durationDay:()=>durationDay,durationWeek:()=>durationWeek,durationMonth:()=>durationMonth,durationYear:()=>durationYear},true);const durationSecond = 1000;
const durationMinute = durationSecond * 60;
const durationHour = durationMinute * 60;
const durationDay = durationHour * 24;
const durationWeek = durationDay * 7;
const durationMonth = durationDay * 30;
const durationYear = durationDay * 365;
