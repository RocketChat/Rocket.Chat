import { useState, useEffect } from 'react';
import WelcomeImage from '../../assets/images/welcome.png';
import styles from './welcomeStyles.scss';
import { createClassName } from '../../helpers/createClassName';
import { Button } from '../../components/Button';

type WelcomeScreenProps={
    onSelectSuggestion:(text:string)=>void
}
export function WelcomeScreen({ onSelectSuggestion }:WelcomeScreenProps) {
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        setCurrentTime(timeString);
    }, []);

    const suggestions = [
        "کاریزما کِلاب چیست؟",
        "طرح سرمایه‌گذاری طلا و نقره چیست؟",
        "چطوری طلا و نقره فیزیکی بخرم؟",
        "طلا بهتره یا نقره؟",
        "سطوح مختلف کاریزما کِلاب چه مزایایی دارند?ُ",
    ];

    return (
        <div className={createClassName(styles, 'welcome-page')}>
            <div className={createClassName(styles, 'message-stack')}>
                <div className={createClassName(styles, 'welcome-header')}>
                    <img src={WelcomeImage} width={56} height={50} alt="Welcome" />
                    <div className={createClassName(styles, 'message-group')}>
                        <div className={createClassName(styles, 'bubble')}>
                            شما با{' '}
                            <strong className={createClassName(styles, 'bubble-strong')}>
                                پشتیبان هوشمند کاریزما
                            </strong>{' '}
                            صحبت می‌کنید.
                        </div>
                        <div className={createClassName(styles, 'timestamp')}>
                            پشتیبان هوشمند - {currentTime}
                        </div>
                    </div>
                </div>
                
                <div className={createClassName(styles, 'message-group')}>
                    <div className={createClassName(styles, 'bubble')}>
                        از من سوال کن یا یکی از موارد زیر رو انتخاب کن.
                    </div>
                    <div className={createClassName(styles, 'timestamp')}>
                        پشتیبان هوشمند - {currentTime}
                    </div>
                </div>
            </div>

            <div className={createClassName(styles, 'chips-wrap')}>
                {suggestions.map((text) => (
                    <Button 
                        key={text} 
                        className={createClassName(styles, 'chip')}
                        onClick={() => onSelectSuggestion && onSelectSuggestion(text)}
                    >
                        {text}
                    </Button>
                ))}
            </div>
        </div>
    );
}
