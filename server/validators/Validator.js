import Joi from 'joi';

class Validator {
    static validateJoinRoom(data) {
        return Joi.object({
            username: Joi.string().min(1).max(50).required(),
            roomId: Joi.string().min(3).max(32).required(),
        }).validate(data);
    }

    static validateSendMessage(data) {
        return Joi.object({
            roomId: Joi.string().min(3).max(32).required(),
            message: Joi.string().max(500).required(),
            sender: Joi.string().min(1).max(50).required(),
            userId: Joi.string().required(),
        }).validate(data);
    }
}

export default Validator;