module.exports = class UserDto {
    email;
    id;
    isactivated;

    constructor(model) {
        this.email = model.email;
        this.id = model.id;
        this.isactivated = model.isactivated;
    }
}