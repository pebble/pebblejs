#include "simply_window.h"

#include "simply_msg.h"
#include "simply_res.h"
#include "simply_menu.h"
#include "simply_window_stack.h"

#include "simply.h"

#include "util/graphics.h"
#include "util/scroll_layer.h"
#include "util/status_bar_layer.h"
#include "util/string.h"

#include <pebble.h>

typedef struct WindowPropsPacket WindowPropsPacket;

struct __attribute__((__packed__)) WindowPropsPacket {
  Packet packet;
  uint32_t id;
  GColor8 background_color;
  bool fullscreen;
  bool scrollable;
};

typedef struct WindowButtonConfigPacket WindowButtonConfigPacket;

struct __attribute__((__packed__)) WindowButtonConfigPacket {
  Packet packet;
  uint8_t button_mask;
};

typedef struct WindowActionBarPacket WindowActionBarPacket;

struct __attribute__((__packed__)) WindowActionBarPacket {
  Packet packet;
  uint32_t image[3];
  bool action;
  GColor8 background_color;
};

typedef struct ClickPacket ClickPacket;

struct __attribute__((__packed__)) ClickPacket {
  Packet packet;
  ButtonId button:8;
};

typedef ClickPacket LongClickPacket;


static GColor8 s_button_palette[] = { { GColorWhiteARGB8 }, { GColorClearARGB8 } };


static void click_config_provider(void *data);

static bool send_click(SimplyMsg *self, Command type, ButtonId button) {
  ClickPacket packet = {
    .packet.type = type,
    .packet.length = sizeof(packet),
    .button = button,
  };
  return simply_msg_send_packet(&packet.packet);
}

static bool send_single_click(SimplyMsg *self, ButtonId button) {
  return send_click(self, CommandClick, button);
}

static bool send_long_click(SimplyMsg *self, ButtonId button) {
  return send_click(self, CommandLongClick, button);
}

static void set_scroll_layer_click_config(SimplyWindow *self) {
  if (!self->scroll_layer) {
    return;
  }

  scroll_layer_set_click_config_provider_onto_window(
      self->scroll_layer, click_config_provider, self->window, self);
}

void simply_window_set_scrollable(SimplyWindow *self, bool is_scrollable) {
  if (self->is_scrollable == is_scrollable) {
    return;
  }

  self->is_scrollable = is_scrollable;

  set_scroll_layer_click_config(self);

  if (!self->layer) {
    return;
  }

  if (!is_scrollable) {
    GRect bounds = { GPointZero, layer_get_bounds(window_get_root_layer(self->window)).size };
    layer_set_bounds(self->layer, bounds);
    const bool animated = true;
    scroll_layer_set_content_offset(self->scroll_layer, GPointZero, animated);
    scroll_layer_set_content_size(self->scroll_layer, bounds.size);
  }

  layer_mark_dirty(self->layer);
}

void simply_window_set_fullscreen(SimplyWindow *self, bool is_fullscreen) {
  const bool was_status_bar = self->is_status_bar;
  self->is_status_bar = !is_fullscreen;

  bool changed = false;
  if (is_fullscreen && was_status_bar) {
    status_bar_layer_remove_from_window(self->window, self->status_bar_layer);
    changed = true;
  } else if (!is_fullscreen && !was_status_bar) {
    status_bar_layer_add_to_window(self->window, self->status_bar_layer);
    changed = true;
  }

  if (!changed || !self->layer) {
    return;
  }

  GRect frame = { GPointZero, layer_get_frame(window_get_root_layer(self->window)).size };
  scroll_layer_set_frame(self->scroll_layer, frame);
  layer_set_frame(self->layer, frame);

#ifdef PBL_SDK_2
  if (!window_stack_contains_window(self->window)) {
    return;
  }

  // HACK: Refresh app chrome state
  uint32_t id = self->id;
  self->id = 0;
  Window *window = window_create();
  window_stack_push(window, false);
  window_stack_remove(window, false);
  window_destroy(window);
  self->id = id;
#endif
}

void simply_window_set_background_color(SimplyWindow *self, GColor8 background_color) {
  self->background_color = background_color;
  window_set_background_color(self->window, gcolor8_get_or(background_color, GColorBlack));
}

void simply_window_set_action_bar(SimplyWindow *self, bool is_action_bar) {
  self->is_action_bar = is_action_bar;

  if (!self->action_bar_layer) {
    return;
  }

  action_bar_layer_remove_from_window(self->action_bar_layer);

  set_scroll_layer_click_config(self);

  if (!is_action_bar) {
    return;
  }

  action_bar_layer_set_context(self->action_bar_layer, self);
  action_bar_layer_set_click_config_provider(self->action_bar_layer, click_config_provider);
  action_bar_layer_add_to_window(self->action_bar_layer, self->window);
}

void simply_window_set_action_bar_icon(SimplyWindow *self, ButtonId button, uint32_t id) {
  if (!self->action_bar_layer) {
    return;
  }

  SimplyImage *icon = simply_res_auto_image(self->simply->res, id, true);

  if (!icon) {
    action_bar_layer_clear_icon(self->action_bar_layer, button);
    return;
  }

  if (icon->is_palette_black_and_white) {
    gbitmap_set_palette(icon->bitmap, s_button_palette, false);
  }

  action_bar_layer_set_icon(self->action_bar_layer, button, icon->bitmap);
  simply_window_set_action_bar(self, true);
}

void simply_window_set_action_bar_background_color(SimplyWindow *self, GColor8 background_color) {
  if (!self->action_bar_layer) {
    return;
  }

  s_button_palette[0] = gcolor8_equal(background_color, GColor8White) ? GColor8Black : GColor8White;

  action_bar_layer_set_background_color(self->action_bar_layer, gcolor8_get(background_color));
  simply_window_set_action_bar(self, true);
}

void simply_window_action_bar_clear(SimplyWindow *self) {
  simply_window_set_action_bar(self, false);

  for (ButtonId button = BUTTON_ID_UP; button <= BUTTON_ID_DOWN; ++button) {
    action_bar_layer_clear_icon(self->action_bar_layer, button);
  }
}

void simply_window_set_button(SimplyWindow *self, ButtonId button, bool enable) {
  if (enable) {
    self->button_mask |= 1 << button;
  } else {
    self->button_mask &= ~(1 << button);
  }
}

void simply_window_single_click_handler(ClickRecognizerRef recognizer, void *context) {
  SimplyWindow *self = context;
  ButtonId button = click_recognizer_get_button_id(recognizer);
  bool is_enabled = (self->button_mask & (1 << button));
  if (button == BUTTON_ID_BACK) {
    if (!simply_msg_has_communicated()) {
      bool animated = true;
      window_stack_pop(animated);
    } else if (!is_enabled) {
      simply_window_stack_back(self->simply->window_stack, self);
    }
  }
  if (is_enabled) {
    send_single_click(self->simply->msg, button);
  }
}

static void long_click_handler(ClickRecognizerRef recognizer, void *context) {
  SimplyWindow *self = context;
  ButtonId button = click_recognizer_get_button_id(recognizer);
  bool is_enabled = (self->button_mask & (1 << button));
  if (is_enabled) {
    send_long_click(self->simply->msg, button);
  }
}

static void click_config_provider(void *context) {
  SimplyWindow *self = context;
  for (int i = 0; i < NUM_BUTTONS; ++i) {
    if (!self->is_scrollable || (i != BUTTON_ID_UP && i != BUTTON_ID_DOWN)) {
      window_set_click_context(i, context);
      window_single_click_subscribe(i, simply_window_single_click_handler);
      window_long_click_subscribe(i, 500, (ClickHandler) long_click_handler, NULL);
    }
  }
  if (self->is_scrollable) {
    scroll_layer_click_config(self->scroll_layer);
  }
}

void simply_window_preload(SimplyWindow *self) {
  if (self->window) {
    return;
  }

  Window *window = self->window = window_create();
  window_set_background_color(window, GColorClear);
  window_set_user_data(window, self);
  if (self->window_handlers) {
    window_set_window_handlers(window, *self->window_handlers);
  }
}

void simply_window_load(SimplyWindow *self) {
  Window *window = self->window;

  Layer *window_layer = window_get_root_layer(window);
  GRect frame = layer_get_frame(window_layer);
  frame.origin = GPointZero;

  ScrollLayer *scroll_layer = self->scroll_layer = scroll_layer_create(frame);
  Layer *scroll_base_layer = scroll_layer_get_layer(scroll_layer);
  layer_add_child(window_layer, scroll_base_layer);

  scroll_layer_set_context(scroll_layer, self);
  scroll_layer_set_shadow_hidden(scroll_layer, true);
  scroll_layer_set_paging(scroll_layer, PBL_IF_ROUND_ELSE(true, false)); // TODO: Expose this to JS

  window_set_click_config_provider_with_context(window, click_config_provider, self);
  simply_window_set_action_bar(self, self->is_action_bar);
}

bool simply_window_appear(SimplyWindow *self) {
  if (!self->id) {
    return false;
  }
  if (simply_msg_has_communicated()) {
    simply_window_stack_send_show(self->simply->window_stack, self);
  }
  return true;
}

bool simply_window_disappear(SimplyWindow *self) {
  if (!self->id) {
    return false;
  }
  if (simply_msg_has_communicated()) {
    simply_window_stack_send_hide(self->simply->window_stack, self);
  }

#ifdef PBL_PLATFORM_BASALT
  simply_window_set_fullscreen(self, true);
#endif

  return true;
}

void simply_window_unload(SimplyWindow *self) {
  scroll_layer_destroy(self->scroll_layer);
  self->scroll_layer = NULL;
}

static void handle_window_props_packet(Simply *simply, Packet *data) {
  WindowPropsPacket *packet = (WindowPropsPacket*) data;
  SimplyWindow *window = simply_window_stack_get_top_window(simply);
  if (!window) {
    return;
  }
  window->id = packet->id;
  simply_window_set_background_color(window, packet->background_color);
  simply_window_set_fullscreen(window, packet->fullscreen);
  simply_window_set_scrollable(window, packet->scrollable);
}

static void handle_window_button_config_packet(Simply *simply, Packet *data) {
  WindowButtonConfigPacket *packet = (WindowButtonConfigPacket*) data;
  SimplyWindow *window = simply_window_stack_get_top_window(simply);
  if (!window) {
    return;
  }
  window->button_mask = packet->button_mask;
}

static void handle_window_action_bar_packet(Simply *simply, Packet *data) {
  WindowActionBarPacket *packet = (WindowActionBarPacket*) data;
  SimplyWindow *window = simply_window_stack_get_top_window(simply);
  if (!window) {
    return;
  }
  simply_window_set_action_bar_background_color(window, packet->background_color);
  for (unsigned int i = 0; i < ARRAY_LENGTH(packet->image); ++i) {
    simply_window_set_action_bar_icon(window, i + 1, packet->image[i]);
  }
  simply_window_set_action_bar(window, packet->action);
}

bool simply_window_handle_packet(Simply *simply, Packet *packet) {
  switch (packet->type) {
    case CommandWindowProps:
      handle_window_props_packet(simply, packet);
      return true;
    case CommandWindowButtonConfig:
      handle_window_button_config_packet(simply, packet);
      return true;
    case CommandWindowActionBar:
      handle_window_action_bar_packet(simply, packet);
      return true;
  }
  return false;
}

SimplyWindow *simply_window_init(SimplyWindow *self, Simply *simply) {
  self->simply = simply;

  for (int i = 0; i < NUM_BUTTONS; ++i) {
    if (i != BUTTON_ID_BACK) {
      self->button_mask |= 1 << i;
    }
  }

  simply_window_preload(self);

  self->status_bar_layer = status_bar_layer_create();
  status_bar_layer_remove_from_window(self->window, self->status_bar_layer);
  self->is_status_bar = false;
  self->is_fullscreen = true;

  ActionBarLayer *action_bar_layer = self->action_bar_layer = action_bar_layer_create();
  action_bar_layer_set_context(action_bar_layer, self);

  return self;
}

void simply_window_deinit(SimplyWindow *self) {
  if (!self) {
    return;
  }

  action_bar_layer_destroy(self->action_bar_layer);
  self->action_bar_layer = NULL;

  status_bar_layer_destroy(self->status_bar_layer);
  self->status_bar_layer = NULL;

  window_destroy(self->window);
  self->window = NULL;
}
