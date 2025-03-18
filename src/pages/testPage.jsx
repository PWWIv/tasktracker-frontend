import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState({});
    const [decryptedPasswords, setDecryptedPasswords] = useState({});
    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [authPassword, setAuthPassword] = useState('');
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        role: 'client'
    });
    const [activeTab, setActiveTab] = useState('admin');

    useEffect(() => {
        let isMounted = true;

        const loadUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                
                if (!import.meta.env.VITE_API_URL) {
                    throw new Error('VITE_API_URL не определен');
                }
                
                const apiUrl = `${import.meta.env.VITE_API_URL}/users`;
                
                const response = await axios.get(apiUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.data) {
                    if (isMounted) {
                        setError('Получен пустой ответ от сервера');
                    }
                    return;
                }
                
                const usersData = Array.isArray(response.data) ? response.data : [response.data];           
                
                if (isMounted) {
                    setUsers(usersData);
                }
            } catch (err) {            
                if (isMounted) {
                    setError(`Ошибка при загрузке пользователей: ${err.message}`);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadUsers();

        return () => {
            isMounted = false;
        };
    }, []);

    // Генерируем или получаем ключ клиента
    const getClientKey = () => {
        let key = localStorage.getItem('clientEncryptionKey');
        if (!key) {
            key = CryptoJS.lib.WordArray.random(32).toString();
            localStorage.setItem('clientEncryptionKey', key);
        }
        return key;
    };

    // Шифрование на стороне клиента
    const encryptClientSide = (password) => {
        const clientKey = getClientKey();
        return CryptoJS.AES.encrypt(password, clientKey).toString();
    };

    // Расшифровка на стороне клиента
    const decryptClientSide = (encryptedPassword) => {
        const clientKey = getClientKey();
        const bytes = CryptoJS.AES.decrypt(encryptedPassword, clientKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    };    

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            
            // Шифруем пароль на клиенте перед отправкой
            const encryptedPassword = encryptClientSide(newUser.password);
            
            await axios({
                method: 'post',
                url: `${import.meta.env.VITE_API_URL}/users`,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    username: newUser.username,
                    email: newUser.email,
                    password: newUser.password,
                    encryptedPassword: encryptedPassword,
                    role: newUser.role
                }
            });

            setShowCreateForm(false);
            setNewUser({ username: '', email: '', password: '', role: 'client' });
            
            // Перезагружаем список пользователей
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const usersData = Array.isArray(response.data) ? response.data : [response.data];
            setUsers(usersData);
        } catch (err) {
            setError('Ошибка при создании пользователя: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(
                    `${import.meta.env.VITE_API_URL}/users/${userId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                // Перезагружаем список пользователей
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/users`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const usersData = Array.isArray(response.data) ? response.data : [response.data];
                setUsers(usersData);
            } catch (err) {
                setError('Ошибка при удалении пользователя');
            }
        }
    };

    const handleShowPassword = async (userId) => {
        setSelectedUserId(userId);
        setShowAuthDialog(true);
    };

    const handlePasswordAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/users/${selectedUserId}/decrypt-password`,
                { 
                    password: authPassword // Для проверки доступа
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Получаем зашифрованный пароль из ответа (проверяем оба возможных поля)
            const encryptedPassword = response.data.encryptedPassword || response.data.password;

            if (encryptedPassword) {
                try {
                    // Расшифровываем пароль на клиенте тем же ключом, которым шифровали
                    const decryptedPassword = decryptClientSide(encryptedPassword);
                    
                    setDecryptedPasswords(prev => ({
                        ...prev,
                        [selectedUserId]: decryptedPassword
                    }));

                    setVisiblePasswords(prev => ({
                        ...prev,
                        [selectedUserId]: true
                    }));

                    // Автоматически скрываем пароль через 30 секунд
                    setTimeout(() => {
                        setVisiblePasswords(prev => ({
                            ...prev,
                            [selectedUserId]: false
                        }));
                        setDecryptedPasswords(prev => ({
                            ...prev,
                            [selectedUserId]: null
                        }));
                    }, 30000);
                } catch (decryptError) {
                    setError('Ошибка при расшифровке пароля. Возможно, ключ шифрования был изменен.');
                }
            } else {
                setError('Сервер не вернул зашифрованный пароль');
            }

            setShowAuthDialog(false);
            setAuthPassword('');
        } catch (err) {            
            setError(`Ошибка при получении пароля: ${err.response?.data?.message || err.message}`);
            setAuthPassword('');
        }
    };

    // Получаем уникальные роли
    const uniqueRoles = [...new Set(users.map(user => user.role))];
    
    // Фильтруем пользователей по активной роли
    const filteredUsers = users.filter(user => user.role === activeTab);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Ошибка!</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Управление пользователями</h1>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    {showCreateForm ? 'Отменить' : 'Создать пользователя'}
                </button>
            </div>

            {showCreateForm && (
                <form onSubmit={handleCreateUser} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                            Имя пользователя
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="username"
                            type="text"
                            value={newUser.username}
                            onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Пароль
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="password"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                            Роль
                        </label>
                        <select
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="role"
                            value={newUser.role}
                            onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                        >
                            <option value="client">Клиент</option>
                            <option value="employee">Сотрудник</option>
                            <option value="admin">Администратор</option>
                        </select>
                    </div>
                    <div className="flex items-center justify-end">
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            type="submit"
                        >
                            Создать
                        </button>
                    </div>
                </form>
            )}            

            <div className="mb-6">
                <div className="flex border-b gap-4">
                    {uniqueRoles.map((role) => (
                        <button
                            key={role}
                            onClick={() => setActiveTab(role)}
                            className={`py-2 px-4 text-sm font-medium focus:outline-none ${
                                activeTab === role 
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {role === 'admin' ? 'Администраторы' : 
                                role === 'employee' ? 'Сотрудники' : 
                                'Клиенты'}
                            <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full">
                                {users.filter(user => user.role === role).length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Имя пользователя
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Пароль
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Роль
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">
                                Действия
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                            <tr key={user._id || user.id}>
                                <td className="px-3 py-4 whitespace-nowrap w-1/4">
                                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap w-1/4">
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap w-1/4">
                                    <div className="flex items-center space-x-2">
                                        <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-md font-mono w-full">
                                            {visiblePasswords[user._id || user.id] ? 
                                                (decryptedPasswords[user._id || user.id] || '[ Загрузка... ]') : 
                                                '•'.repeat(8)}
                                        </div>
                                        <button
                                            onClick={() => handleShowPassword(user._id || user.id)}
                                            className="text-gray-600 hover:text-gray-900 bg-gray-100 p-1 rounded-full transition-colors duration-200"
                                            title={visiblePasswords[user._id || user.id] ? "Скрыть пароль" : "Показать пароль"}
                                        >
                                            {visiblePasswords[user._id || user.id] ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                    </div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap w-1/10">
                                    <select className={`px-2 py-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                                            user.role === 'employee' ? 'bg-blue-100 text-blue-800' : 
                                            'bg-green-100 text-green-800'}`} disabled>                                            
                                            <option value={user.role}>{user.role === 'admin' ? 'Администратор' : 
                                            user.role === 'employee' ? 'Сотрудник' : 
                                            'Клиент'}</option>                                                                                    
                                    </select>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap w-1/12">
                                    <div className="flex items-center space-x-4">                                        
                                        <button
                                            onClick={() => handleUpdateUser(user.id, 'admin')}
                                            className="text-blue-600 hover:text-blue-900"
                                        >  
                                            ✏️                                            
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showAuthDialog && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Подтверждение доступа</h2>
                        <p className="mb-4 text-gray-600">
                            Для просмотра пароля требуется подтверждение. Введите ваш пароль:
                        </p>
                        <input
                            type="password"
                            className="w-full p-2 border rounded mb-4"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            placeholder="Введите ваш пароль"
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    setShowAuthDialog(false);
                                    setAuthPassword('');
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handlePasswordAuth}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Подтвердить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage; 