#pragma once
#include "simply_msg.h"
#include "simply.h"
#include <pebble.h>
#define SIMPLY_USER_DATA_BUFFER_LENGTH 512

typedef struct SimplyUserData SimplyUserData;

struct SimplyUserData {
	Simply *simply;
};

SimplyUserData *simply_user_data_create(Simply *simply);
void simply_user_data_destroy(SimplyUserData *self);
bool simply_user_data_handle_packet(Simply *simply, Packet *packet);