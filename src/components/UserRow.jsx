import React from 'react';

const UserRow = ({ 
    user, 
    editUser,
    editForm,
    setEditForm,
    visiblePasswords,
    decryptedPasswords,
    onShowPassword,
    onSave,
    onEdit,
    onCancel,
    onDelete,
    isEditing,
    createMode
}) => {
    return (
        <form className="grid grid-cols-5 gap-4 p-3 hover:bg-gray-50">
            <div className="flex items-center">                                
                <input 
                    className="w-full border rounded py-2 px-3 text-gray-700"
                    type="text"
                    value={isEditing ? editForm.username : user.username}
                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                    placeholder="Имя пользователя"
                    disabled={!isEditing} 
                />                                
            </div>
            <div className="flex items-center">                                
                <input 
                    className="w-full border rounded py-2 px-3 text-gray-700"
                    type="text" 
                    value={isEditing ? editForm.email : user.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    placeholder="Email"
                    disabled={!isEditing}
                />                                
            </div>
            <div className="flex items-center gap-2">                                
                <input 
                    className="w-full border rounded py-2 px-3 text-gray-700"
                    type={isEditing ? "text" : "password"}
                    value={isEditing ? editForm.password : ''}
                    onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                    placeholder={isEditing ? 
                        "Введите новый пароль" : 
                        (visiblePasswords[user._id || user.id] ? 
                            (decryptedPasswords[user._id || user.id] || '[ Загрузка... ]') : 
                            '•'.repeat(8))}
                    disabled={!isEditing}
                />
                {!createMode && (
                    <button                                    
                        onClick={(e) => {
                            e.preventDefault();
                            onShowPassword(user._id || user.id);
                        }}
                        className="text-gray-600 hover:text-gray-900 bg-gray-100 p-1 rounded-full"
                        title={visiblePasswords[user._id || user.id] ? "Скрыть пароль" : "Показать пароль"}
                        disabled={isEditing}
                    >
                        {visiblePasswords[user._id || user.id] ? '👁️' : '👁️‍🗨️'}
                    </button>
                )}                               
            </div>
            <div className="flex items-center">                                
                <select 
                    className="w-full border rounded py-2 px-3 text-gray-700"
                    value={isEditing ? editForm.role : user.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    disabled={!isEditing}
                >
                    <option value="client">Клиент</option>
                    <option value="employee">Сотрудник</option>
                    <option value="admin">Администратор</option>
                </select>                                
            </div>
            <div className="flex items-center space-x-4">
                {isEditing ? (
                    <>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onSave(user._id || user.id);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Сохранить"
                        >
                            💾
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onCancel();
                            }}
                            className="text-gray-600 hover:text-gray-900"
                            title="Отменить"
                        >
                            ❌
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onEdit(user);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Редактировать"
                        >
                            ✏️
                        </button>
                        {!createMode && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onDelete(user._id || user.id);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Удалить"
                            >
                                🗑️
                            </button>
                        )}
                    </>
                )}
            </div>
        </form>
    );
};

export default UserRow; 