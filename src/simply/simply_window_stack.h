#pragma once

#include "simply_window.h"

#include "simply_msg.h"

#include "simply.h"

#include "util/sdk.h"

#include <pebble.h>

typedef struct SimplyWindowStack SimplyWindowStack;

struct SimplyWindowStack {
  Simply *simply;
  IF_SDK_2_ELSE(Window *pusher, NONE);
  bool is_showing:1;
  bool is_hiding:1;
};

SimplyWindowStack *simply_window_stack_create(Simply *simply);
void simply_window_stack_destroy(SimplyWindowStack *self);

bool simply_window_stack_set_broadcast(bool broadcast);

SimplyWindow *simply_window_stack_get_top_window(Simply *simply);

void simply_window_stack_show(SimplyWindowStack *self, SimplyWindow *window, bool is_push);
void simply_window_stack_pop(SimplyWindowStack *self, SimplyWindow *window);
void simply_window_stack_back(SimplyWindowStack *self, SimplyWindow *window);

void simply_window_stack_send_load(SimplyWindowStack *self, SimplyWindow *window, GSize size);
void simply_window_stack_send_show(SimplyWindowStack *self, SimplyWindow *window);
void simply_window_stack_send_hide(SimplyWindowStack *self, SimplyWindow *window);

bool simply_window_stack_handle_packet(Simply *simply, Packet *packet);
