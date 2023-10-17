const jwt = require('jsonwebtoken');
const db = require('../db');
class TokenService{
    generateTokens(payload){
        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {expiresIn:'15m'})
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {expiresIn:'30d'})
        return {
            accessToken,
            refreshToken
        }
    }

    validateAccessToken(token){
        try{
            const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            return userData;
        } catch (e) {
            return null;
        }
    }

    validateRefreshToken(token){
        try{
            const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
            return userData;
        } catch (e) {
            return null;
        }
    }

    async saveToken(userId, refreshToken){
        const tokenData = await db.query('SELECT * FROM tokens WHERE user_id = $1',[userId]);
        if(tokenData.rows[0]) {
            const token = await db.query(`UPDATE tokens SET refreshtoken =  $1 WHERE user_id = $2 RETURNING *`,[refreshToken, userId])
            return token;
        }
        const token = await db.query(`INSERT INTO tokens(user_id, refreshtoken) VALUES ($1, $2) RETURNING *`,[userId, refreshToken])
        return token;
    }

    async removeToken(refreshToken){
        const tokenData = await db.query('DELETE FROM tokens WHERE refreshToken = $1 RETURNING *', [refreshToken])
        return tokenData;
    }

    async findToken(refreshToken){
        const tokenData = (await db.query('SELECT * FROM tokens WHERE refreshToken = $1', [refreshToken])).rows[0]
        return tokenData;
    }
}

module.exports = new TokenService();