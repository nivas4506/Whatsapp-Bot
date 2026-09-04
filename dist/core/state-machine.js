export const VALID_TRANSITIONS = {
    NEW: ['UNDERSTANDING', 'FAQ_ANSWERING', 'REQUIREMENT_INTAKE', 'HUMAN_REVIEW', 'CLOSED'],
    UNDERSTANDING: ['FAQ_ANSWERING', 'REQUIREMENT_INTAKE', 'HUMAN_REVIEW', 'CLOSED'],
    FAQ_ANSWERING: ['UNDERSTANDING', 'REQUIREMENT_INTAKE', 'HUMAN_REVIEW', 'CLOSED'],
    REQUIREMENT_INTAKE: ['FORM_PENDING', 'HUMAN_REVIEW', 'CLOSED'],
    FORM_PENDING: ['REQUIREMENT_INTAKE', 'HUMAN_REVIEW', 'CLOSED'],
    HUMAN_REVIEW: ['UNDERSTANDING', 'REQUIREMENT_INTAKE', 'CLOSED'],
    CLOSED: ['NEW', 'UNDERSTANDING'],
};
export class ConversationStateMachine {
    static canTransition(current, target) {
        if (current === target)
            return true;
        const allowed = VALID_TRANSITIONS[current];
        return allowed ? allowed.includes(target) : false;
    }
    static assertValidTransition(current, target) {
        if (!this.canTransition(current, target)) {
            throw new Error(`Invalid state transition from ${current} to ${target}`);
        }
    }
}
