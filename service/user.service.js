const db = require('../db');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const mailService = require('./mail.service');
const tokenService = require('./token.service')
const UserDto = require('../dtos/user.dto')
const ApiError = require('../exceptions/api.error');
class UserService{
    async registration(email, password){
        const candidate = await db.query(`SELECT * FROM users WHERE email = $1`,[email])
        if(candidate.rows[0])
            throw ApiError.BadRequest(`Пользователь с почтовым адресом ${email} уже существует`)
        const hashPassword = await bcrypt.hash(password, 3);
        const activationLink = uuid.v4();
        const user = await db.query(`INSERT INTO users(email, password, activationlink) VALUES ($1, $2, $3) RETURNING *`, [email, hashPassword, activationLink]);
        await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`);
        const userDto = new UserDto(user.rows[0]);
        const tokens = tokenService.generateTokens({...userDto});
        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return{...tokens, user: userDto}
    }

    async activate(activationLink){
        const user = (await db.query(`SELECT * FROM users WHERE activationlink = $1`, [activationLink])).rows[0];
        if(!user)
            throw ApiError.BadRequest('Неккоректная ссылка активации')
        await db.query(`UPDATE users SET isactivated = true WHERE id = $1`, [user.id])
    }

    async login(email, password) {
        const user = (await db.query(`SELECT * FROM users WHERE email = $1`, [email])).rows[0]
        console.log(user)
        console.log(email)
        console.log(password)
        if(!user)
            throw ApiError.BadRequest('Пользователь с таким email не найден');
        const isPassEquals = await bcrypt.compare(password, user.password);
        if(!isPassEquals)
            throw ApiError.BadRequest('Неверный пароль');
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto});
        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return{...tokens, user: userDto}
    }

    async logout(refreshToken){
        const token = await tokenService.removeToken(refreshToken);
        return token;
    }

    async refresh(refreshToken){
        if(!refreshToken){
            throw ApiError.UnauthorizedError();
        }
        const userData = tokenService.validateRefreshToken(refreshToken);
        console.log(userData);
        const tokenFromDb = await tokenService.findToken(refreshToken)
        if(!userData || !tokenFromDb)
            throw ApiError.UnauthorizedError();
        const user = (await db.query(`SELECT * FROM users WHERE id = $1`, [userData.id])).rows[0];
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto});
        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return{...tokens, user: userDto}
    }

    async getAllUsers(){
        const users = (await db.query(`SELECT * FROM users`)).rows
        return users;
    }
}

module.exports = new UserService();