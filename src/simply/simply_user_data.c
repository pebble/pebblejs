#include "simply_user_data.h"
#include "simply_msg.h"
#include "simply.h"
#include "pebble.h"

typedef struct UserDataPacket UserDataPacket;
struct __attribute__((__packed__)) UserDataPacket {
	Packet packet;
	uint8_t err;
	char result[SIMPLY_USER_DATA_BUFFER_LENGTH];
};

static SimplyUserData *s_user_data = NULL;

static void handle_user_data_packet(Simply *simply, Packet *data) {
  APP_LOG(APP_LOG_LEVEL_INFO, "USER DATA PACKET");
}

bool simply_user_data_handle_packet(Simply *simply, Packet *packet) {
  switch (packet->type) {
    case CommandUserData:
      handle_user_data_packet(simply, packet);
      return true;
  }

  return false;
}

SimplyUserData *simply_user_data_create(Simply *simply) {
  if(s_user_data) {
    return s_user_data;
  }

  SimplyUserData *self = malloc(sizeof(*self));
  *self = (SimplyUserData) {
  	.simply = simply,
  };

  s_user_data = self;
  return self;
}

void simply_user_data_destroy(SimplyUserData *self) {
  if (!self) {
    return;
  }

  free(self);
  s_user_data = NULL;
}
