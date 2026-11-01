/* Shared fiscal-year navigation. Month keys are YYYY-MM for chronological comparison. */
window.CalendarMonthNav = {
    today() {
        const parts = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit' }).format(new Date());
        return parts.slice(0, 7);
    },
    initial(months, key) {
        const today = this.today();
        return months.find(m => key(m) >= today) ?? months[months.length - 1];
    },
    render(nav, months, current, key, onChange) {
        const index = months.indexOf(current);
        nav.replaceChildren();
        const makeButton = (label, target, disabled = false) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'month-step';
            button.textContent = label;
            button.disabled = disabled;
            button.onclick = () => onChange(target);
            return button;
        };
        const heading = document.createElement('div');
        heading.className = 'month-heading';
        heading.setAttribute('aria-live', 'polite');
        const [year, month] = key(current).split('-');
        const eyebrow = document.createElement('span');
        eyebrow.textContent = 'SCHEDULE / 開催スケジュール';
        const title = document.createElement('strong');
        title.textContent = `${year}年 ${Number(month)}月`;
        heading.append(eyebrow, title);
        const controls = document.createElement('div');
        controls.className = 'month-controls';
        const select = document.createElement('select');
        select.setAttribute('aria-label', '年月を選択（過去の月も確認できます）');
        months.forEach(m => {
            const option = document.createElement('option');
            option.value = String(m);
            const [y, mo] = key(m).split('-');
            option.textContent = `${y}年 ${Number(mo)}月${key(m) < this.today() ? '（過去）' : ''}`;
            option.selected = m === current;
            select.append(option);
        });
        select.onchange = () => onChange(months.find(m => String(m) === select.value));
        const today = this.today();
        const thisMonth = months.find(m => key(m) === today);
        controls.append(makeButton('← 前月', months[index - 1], index === 0), select,
            makeButton('翌月 →', months[index + 1], index === months.length - 1));
        if (thisMonth !== undefined) controls.append(makeButton('今月に戻る', thisMonth, current === thisMonth));
        nav.append(heading, controls);
    }
};
