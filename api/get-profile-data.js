// api/get-profile-data.js
export default async function handler(req, res) {
    const BIRTH_DATE = "2006-05-27"; // Твоя дата рождения
    
    const calculateAge = (birthday) => {
        // Получаем текущую дату строго в Московском часовом поясе
        const moscowString = new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" });
        const today = new Date(moscowString);
        
        const birth = new Date(birthday);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    const age = calculateAge(BIRTH_DATE);

    // Кэшируем результат на 1 час
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    
    return res.status(200).json({
        age: age
    });
}
