import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import UserRow from '../components/UserRow';

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
    const [editUser, setEditUser] = useState(null);
    const [editForm, setEditForm] = useState({
        username: '',
        email: '',
        password: '',
        decryptedPassword: '',
        role: ''
    });
    const [createUser, setCreateUser] = useState(null);

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

    const handleCreateUser = async () => {
        try {
            // Проверяем обязательные поля
            if (!newUser.username || !newUser.email || !newUser.password || !newUser.role) {
                setError('Пожалуйста, заполните все обязательные поля');
                return;
            }

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

    const uniqueRoles = [...new Set(users.map(user => user.role))];
    
    const filteredUsers = users.filter(user => user.role === activeTab);

    const handleStartEdit = (user) => {
        setEditUser(user._id || user.id);
        
        const decryptedPassword = decryptedPasswords[user._id || user.id] || '';
        
        setEditForm({
            username: user.username,
            email: user.email,
            password: decryptedPassword,
            role: user.role
        });

        if (!decryptedPasswords[user._id || user.id]) {
            handleShowPassword(user._id || user.id);
        }
    };

    const handleSaveEdit = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const dataToUpdate = {
                ...editForm
            };

            // Если пароль был изменен, добавляем и зашифрованный пароль
            if (editForm.password) {
                dataToUpdate.encryptedPassword = encryptClientSide(editForm.password);
                dataToUpdate.password = editForm.password;
            }

            // Удаляем пустые поля
            Object.keys(dataToUpdate).forEach(key => {
                if (!dataToUpdate[key]) delete dataToUpdate[key];
            });

            await axios.patch(
                `${import.meta.env.VITE_API_URL}/users/${userId}`,
                dataToUpdate,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Обновляем список пользователей
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const usersData = Array.isArray(response.data) ? response.data : [response.data];
            setUsers(usersData);
            setEditUser(null);
            setEditForm({
                username: '',
                email: '',
                password: '',
                encryptedPassword: '',
                role: ''
            });
        } catch (err) {
            setError('Ошибка при обновлении пользователя: ' + (err.response?.data?.message || err.message));
        }
    };

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
        <div className="container mx-auto p-4 flex flex-wrap">
            <div className="w-full flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold mb-4">Управление пользователями</h1>
                <button
                    onClick={() => setCreateUser(!createUser)}
                    className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
                >
                    {createUser ? 'Отменить' : 'Создать пользователя'}
                </button>
            </div>            

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="mb-6 w-full">
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

            <div className="bg-white shadow-md rounded-lg overflow-hidden w-full">
                <div className="bg-gray-50 grid grid-cols-5 gap-4 p-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Имя пользователя
                    </div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                    </div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Пароль
                    </div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Роль
                    </div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                    </div>
                </div>                

                {filteredUsers.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                        Нет пользователей для отображения
                    </div>
                )}

                
                <div className="divide-y divide-gray-200">
                    {createUser && (
                        <UserRow
                            user={newUser}
                            editForm={newUser}
                            setEditForm={setNewUser}
                            visiblePasswords={{}}
                            decryptedPasswords={{}}
                            onShowPassword={() => {}}
                            onSave={handleCreateUser}
                            onEdit={() => {}}
                            onCancel={() => setCreateUser(false)}
                            onDelete={() => {}}
                            isEditing={true}
                            createMode={true}
                        />
                    )}
                    {filteredUsers.map((user) => (
                        <UserRow
                            key={user._id || user.id}
                            user={user}
                            editUser={editUser}
                            editForm={editForm}
                            setEditForm={setEditForm}
                            visiblePasswords={visiblePasswords}
                            decryptedPasswords={decryptedPasswords}
                            onShowPassword={handleShowPassword}
                            onSave={handleSaveEdit}
                            onEdit={handleStartEdit}
                            onCancel={() => setEditUser(null)}
                            onDelete={handleDeleteUser}
                            isEditing={editUser === (user._id || user.id)}
                            createMode={false}
                        />
                    ))}
                </div>
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