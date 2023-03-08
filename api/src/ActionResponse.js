class ActionResponse {
  constructor(type, roomCode, data, client = false) {
    this.type = type;
    this.data = data;
    this.roomCode = roomCode;
    this.client = client;
  }

  typeOfResponse = this.client ? "actionResponseClient" : "actionResponse";

  sendToClient(io) {
    io.to(this.roomCode).emit(this.typeOfResponse, {
      type: this.type,
      ...this.data,
    });
    console.log(`<${this.type} ${this.typeOfResponse}> sent to client.`);
  }
}

exports.ActionResponse = ActionResponse;
