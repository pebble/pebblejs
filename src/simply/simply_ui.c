#include "simply_ui.h"

#include "simply_msg.h"
#include "simply_res.h"
#include "simply_window_stack.h"

#include "simply.h"

#include "util/color.h"
#include "util/graphics.h"
#include "util/math.h"
#include "util/noop.h"
#include "util/string.h"
#include "util/window.h"

#include <pebble.h>

#define TEXT_FLOW_INSET 8

struct SimplyStyle {
  const char* title_font;
  const char* subtitle_font;
  const char* body_font;
  int custom_body_font_id;
};

enum ClearIndex {
  ClearAction = 0,
  ClearText,
  ClearImage,
};

static SimplyStyle STYLES[] = {
  {
    .title_font = FONT_KEY_GOTHIC_24_BOLD,
    .subtitle_font = FONT_KEY_GOTHIC_18_BOLD,
    .body_font = FONT_KEY_GOTHIC_18,
  },
  {
    .title_font = FONT_KEY_GOTHIC_28_BOLD,
    .subtitle_font = FONT_KEY_GOTHIC_28,
    .body_font = FONT_KEY_GOTHIC_24_BOLD,
  },
  {
    .title_font = FONT_KEY_GOTHIC_24_BOLD,
    .subtitle_font = FONT_KEY_GOTHIC_18_BOLD,
    .custom_body_font_id = RESOURCE_ID_MONO_FONT_14,
  },
};

typedef struct CardClearPacket CardClearPacket;

struct __attribute__((__packed__)) CardClearPacket {
  Packet packet;
  uint8_t flags;
};

typedef struct CardTextPacket CardTextPacket;

struct __attribute__((__packed__)) CardTextPacket {
  Packet packet;
  uint8_t index;
  GColor8 color;
  char text[];
};

typedef struct CardImagePacket CardImagePacket;

struct __attribute__((__packed__)) CardImagePacket {
  Packet packet;
  uint32_t image;
  uint8_t index;
};

typedef struct CardStylePacket CardStylePacket;

struct __attribute__((__packed__)) CardStylePacket {
  Packet packet;
  uint8_t style;
};

static void mark_dirty(SimplyUi *self) {
  if (self->ui_layer.layer) {
    layer_mark_dirty(self->ui_layer.layer);
  }
}

void simply_ui_clear(SimplyUi *self, uint32_t clear_mask) {
  if (clear_mask & (1 << ClearAction)) {
    simply_window_action_bar_clear(&self->window);
  }
  if (clear_mask & (1 << ClearText)) {
    for (int textfield_id = 0; textfield_id < NumUiTextfields; ++textfield_id) {
      simply_ui_set_text(self, textfield_id, NULL);
      simply_ui_set_text_color(self, textfield_id, GColor8Black);
    }
  }
  if (clear_mask & (1 << ClearImage)) {
    memset(self->ui_layer.imagefields, 0, sizeof(self->ui_layer.imagefields));
  }
}

void simply_ui_set_style(SimplyUi *self, int style_index) {
  if (self->ui_layer.custom_body_font) {
    fonts_unload_custom_font(self->ui_layer.custom_body_font);
    self->ui_layer.custom_body_font = NULL;
  }
  self->ui_layer.style = &STYLES[style_index];
  if (self->ui_layer.style->custom_body_font_id) {
    self->ui_layer.custom_body_font = fonts_load_custom_font(
        resource_get_handle(self->ui_layer.style->custom_body_font_id));
  }
  mark_dirty(self);
}

void simply_ui_set_text(SimplyUi *self, SimplyUiTextfieldId textfield_id, const char *str) {
  SimplyUiTextfield *textfield = &self->ui_layer.textfields[textfield_id];
  char **str_field = &textfield->text;
  strset(str_field, str);
  mark_dirty(self);
}

void simply_ui_set_text_color(SimplyUi *self, SimplyUiTextfieldId textfield_id, GColor8 color) {
  SimplyUiTextfield *textfield = &self->ui_layer.textfields[textfield_id];
  textfield->color = color;
  mark_dirty(self);
}

static void enable_text_flow_and_paging(SimplyUi *self, GTextAttributes *text_attributes,
                                        const GRect *box) {
  graphics_text_attributes_enable_screen_text_flow(text_attributes, TEXT_FLOW_INSET);
  graphics_text_attributes_enable_paging(
      text_attributes, box->origin, layer_get_bounds((Layer *)self->window.scroll_layer));
}

static void layer_update_callback(Layer *layer, GContext *ctx) {
  SimplyUi *self = *(void **)layer_get_data(layer);

  const GTextAlignment text_align =
      PBL_IF_ROUND_ELSE((self->window.is_action_bar ? GTextAlignmentRight : GTextAlignmentCenter),
                        GTextAlignmentLeft);

  GRect window_frame = layer_get_frame(window_get_root_layer(self->window.window));
  GRect frame = layer_get_frame(layer);

  const SimplyStyle *style = self->ui_layer.style;
  GFont title_font = fonts_get_system_font(style->title_font);
  GFont subtitle_font = fonts_get_system_font(style->subtitle_font);
  GFont body_font = self->ui_layer.custom_body_font ?
      self->ui_layer.custom_body_font : fonts_get_system_font(style->body_font);

  const int16_t margin_x = 5;
  const int16_t margin_y = 2;
  const int16_t image_offset_y = 3;

  GRect text_frame = frame;
  text_frame.size.w -= 2 * margin_x;
  text_frame.size.h += 1000;
  GPoint cursor = { margin_x, margin_y };

  if (self->window.is_action_bar) {
    text_frame.size.w -= ACTION_BAR_WIDTH + PBL_IF_ROUND_ELSE(TEXT_FLOW_INSET, 0);
    window_frame.size.w -= ACTION_BAR_WIDTH;
  }

  graphics_context_set_text_color(ctx, GColorBlack);

  const SimplyUiTextfield *title = &self->ui_layer.textfields[UiTitle];
  const SimplyUiTextfield *subtitle = &self->ui_layer.textfields[UiSubtitle];
  const SimplyUiTextfield *body = &self->ui_layer.textfields[UiBody];

  GTextAttributes *title_attributes = graphics_text_attributes_create();
  GTextAttributes *subtitle_attributes = graphics_text_attributes_create();
  GTextAttributes *body_attributes = graphics_text_attributes_create();

  bool has_title = is_string(title->text);
  bool has_subtitle = is_string(subtitle->text);
  bool has_body = is_string(body->text);

  GSize title_size, subtitle_size;
  GPoint title_pos, subtitle_pos, image_pos = GPointZero;
  GRect body_rect;

  SimplyImage *title_icon = simply_res_get_image(
      self->window.simply->res, self->ui_layer.imagefields[UiTitleIcon]);
  SimplyImage *subtitle_icon = simply_res_get_image(
      self->window.simply->res, self->ui_layer.imagefields[UiSubtitleIcon]);
  SimplyImage *body_image = simply_res_get_image(
      self->window.simply->res, self->ui_layer.imagefields[UiBodyImage]);

  GRect title_icon_bounds =
      title_icon ? gbitmap_get_bounds(title_icon->bitmap) : GRectZero;
  GRect subtitle_icon_bounds =
      subtitle_icon ? gbitmap_get_bounds(subtitle_icon->bitmap) : GRectZero;
  GRect body_image_bounds;

  if (has_title) {
    GRect title_frame = { cursor, text_frame.size };
    if (title_icon) {
      title_icon_bounds.origin = title_frame.origin;
      title_icon_bounds.origin.y += image_offset_y;
      PBL_IF_RECT_ELSE({
        title_frame.origin.x += title_icon_bounds.size.w;
        title_frame.size.w -= title_icon_bounds.size.w;
      }, {
        title_frame.origin.y += title_icon_bounds.size.h;
      });
    }
#if defined(PBL_PLATFORM_CHALK)
    enable_text_flow_and_paging(self, title_attributes, &title_frame);
#endif
    title_size = graphics_text_layout_get_content_size_with_attributes(
        title->text, title_font, title_frame, GTextOverflowModeWordWrap, text_align,
        title_attributes);
    title_size.w = title_frame.size.w;
    title_pos = title_frame.origin;
    cursor.y = title_frame.origin.y + title_size.h;
  }

  if (has_subtitle) {
    GRect subtitle_frame = { cursor, text_frame.size };
    if (subtitle_icon) {
      subtitle_icon_bounds.origin = subtitle_frame.origin;
      subtitle_icon_bounds.origin.y += image_offset_y;
      PBL_IF_RECT_ELSE({
        subtitle_frame.origin.x += subtitle_icon_bounds.size.w;
        subtitle_frame.size.w -= subtitle_icon_bounds.size.w;
      }, {
        subtitle_frame.origin.y += subtitle_icon_bounds.size.h;
      });
    }
#if defined(PBL_PLATFORM_CHALK)
    enable_text_flow_and_paging(self, subtitle_attributes, &subtitle_frame);
#endif
    subtitle_size = graphics_text_layout_get_content_size_with_attributes(
        subtitle->text, subtitle_font, subtitle_frame, GTextOverflowModeWordWrap, text_align,
        subtitle_attributes);
    subtitle_size.w = subtitle_frame.size.w;
    subtitle_pos = subtitle_frame.origin;
    if (subtitle_icon) {
      subtitle_pos.x += subtitle_icon_bounds.size.w;
    }
    cursor.y = subtitle_frame.origin.y + subtitle_size.h;
  }

  if (body_image) {
    body_image_bounds = gbitmap_get_bounds(body_image->bitmap);
  }

  if (has_body) {
    body_rect = (GRect) { cursor, (self->window.is_scrollable ? text_frame.size : frame.size) };
    body_rect.origin = cursor;
    body_rect.size.w = text_frame.size.w;
    body_rect.size.h -= 2 * margin_y + cursor.y;
    if (body_image) {
      image_pos = body_rect.origin;
      body_rect.origin.y += body_image_bounds.size.h;
    }
#if defined(PBL_PLATFORM_CHALK)
    enable_text_flow_and_paging(self, body_attributes, &body_rect);
#endif
    GSize body_size = graphics_text_layout_get_content_size_with_attributes(
        body->text, body_font, body_rect, GTextOverflowModeWordWrap, text_align, body_attributes);
    if (self->window.is_scrollable) {
      body_rect.size = body_size;
      int16_t new_height = cursor.y + 2 * margin_y + body_size.h;
      frame.size.h = window_frame.size.h > new_height ? window_frame.size.h : new_height;
      layer_set_frame(layer, frame);
      scroll_layer_set_content_size(self->window.scroll_layer, frame.size);
    } else if (!self->ui_layer.custom_body_font && body_size.h > body_rect.size.h) {
      body_font = fonts_get_system_font(FONT_KEY_GOTHIC_18);
    }
    cursor.y = body_rect.origin.y + body_size.h;
  }

  graphics_context_set_fill_color(ctx, GColorBlack);
  graphics_fill_rect(ctx, frame, 0, GCornerNone);

  const int radius = SDK_SELECT(0, 4);
  graphics_context_set_fill_color(ctx, gcolor8_get_or(self->window.background_color, GColorWhite));
  graphics_fill_rect(ctx, frame, radius, GCornersAll);

  if (title_icon) {
    GRect icon_frame = title_icon_bounds;
    icon_frame.origin.x =
        PBL_IF_ROUND_ELSE((frame.size.w - title_icon_bounds.size.w) / 2, margin_x);
    PBL_IF_RECT_ELSE(icon_frame.size.h = title_size.h, NOOP);
    graphics_context_set_alpha_blended(ctx, true);
    graphics_draw_bitmap_centered(ctx, title_icon->bitmap, icon_frame);
  }
  if (has_title) {
    graphics_context_set_text_color(ctx, gcolor8_get_or(title->color, GColorBlack));
    graphics_draw_text(ctx, title->text, title_font, (GRect) { title_pos, title_size },
                       GTextOverflowModeWordWrap, text_align, title_attributes);
  }

  if (subtitle_icon) {
    GRect subicon_frame = subtitle_icon_bounds;
    subicon_frame.origin.x =
        PBL_IF_ROUND_ELSE((frame.size.w - subtitle_icon_bounds.size.w) / 2, margin_x);
    PBL_IF_RECT_ELSE(subicon_frame.size.h = subtitle_size.h, NOOP);
    graphics_context_set_alpha_blended(ctx, true);
    graphics_draw_bitmap_centered(ctx, subtitle_icon->bitmap, subicon_frame);
  }
  if (has_subtitle) {
    graphics_context_set_text_color(ctx, gcolor8_get_or(subtitle->color, GColorBlack));
    graphics_draw_text(ctx, subtitle->text, subtitle_font, (GRect) { subtitle_pos, subtitle_size },
                       GTextOverflowModeWordWrap, text_align, subtitle_attributes);
  }

  if (body_image) {
    GRect image_frame = (GRect) {
      .origin = {
        PBL_IF_ROUND_ELSE(((frame.size.w - body_rect.size.w) / 2), 0),
        image_pos.y + image_offset_y,
      },
      .size = { window_frame.size.w, body_image_bounds.size.h }
    };
    graphics_context_set_alpha_blended(ctx, true);
    graphics_draw_bitmap_centered(ctx, body_image->bitmap, image_frame);
  }
  if (has_body) {
    graphics_context_set_text_color(ctx, gcolor8_get_or(body->color, GColorBlack));
    graphics_draw_text(ctx, body->text, body_font, body_rect,
                       GTextOverflowModeTrailingEllipsis, text_align, body_attributes);
  }

  graphics_text_attributes_destroy(title_attributes);
  graphics_text_attributes_destroy(subtitle_attributes);
  graphics_text_attributes_destroy(body_attributes);
}

static void show_welcome_text(SimplyUi *self) {
  if (simply_msg_has_communicated()) {
    return;
  }

  simply_msg_show_disconnected(self->window.simply->msg);
}

static void window_load(Window *window) {
  SimplyUi *self = window_get_user_data(window);

  simply_window_load(&self->window);

  Layer *window_layer = window_get_root_layer(window);
  GRect frame = layer_get_frame(window_layer);
  frame.origin = GPointZero;

  Layer *layer = layer_create_with_data(frame, sizeof(void*));
  self->window.layer = self->ui_layer.layer = layer;
  *(void**) layer_get_data(layer) = self;
  layer_set_update_proc(layer, layer_update_callback);
  scroll_layer_add_child(self->window.scroll_layer, layer);

  simply_ui_set_style(self, 1);
}

static void window_appear(Window *window) {
  SimplyUi *self = window_get_user_data(window);
  simply_window_appear(&self->window);
}

static void window_disappear(Window *window) {
  SimplyUi *self = window_get_user_data(window);
  if (simply_window_disappear(&self->window)) {
    simply_res_clear(self->window.simply->res);
  }
}

static void window_unload(Window *window) {
  SimplyUi *self = window_get_user_data(window);

  layer_destroy(self->ui_layer.layer);
  self->window.layer = self->ui_layer.layer = NULL;

  simply_window_unload(&self->window);
}

static void handle_card_clear_packet(Simply *simply, Packet *data) {
  CardClearPacket *packet = (CardClearPacket*) data;
  simply_ui_clear(simply->ui, packet->flags);
}

static void handle_card_text_packet(Simply *simply, Packet *data) {
  CardTextPacket *packet = (CardTextPacket*) data;
  SimplyUiTextfieldId textfield_id = packet->index;
  if (textfield_id >= NumUiTextfields) {
    return;
  }
  simply_ui_set_text(simply->ui, textfield_id, packet->text);
  if (!gcolor8_equal(packet->color, GColor8ClearWhite)) {
    simply_ui_set_text_color(simply->ui, textfield_id, packet->color);
  }
}

static void handle_card_image_packet(Simply *simply, Packet *data) {
  CardImagePacket *packet = (CardImagePacket*) data;
  SimplyUiImagefieldId imagefield_id = packet->index;
  if (imagefield_id >= NumUiImagefields) {
    return;
  }
  simply->ui->ui_layer.imagefields[imagefield_id] = packet->image;
  window_stack_schedule_top_window_render();
}

static void handle_card_style_packet(Simply *simply, Packet *data) {
  CardStylePacket *packet = (CardStylePacket*) data;
  simply_ui_set_style(simply->ui, packet->style);
}

bool simply_ui_handle_packet(Simply *simply, Packet *packet) {
  switch (packet->type) {
    case CommandCardClear:
      handle_card_clear_packet(simply, packet);
      return true;
    case CommandCardText:
      handle_card_text_packet(simply, packet);
      return true;
    case CommandCardImage:
      handle_card_image_packet(simply, packet);
      return true;
    case CommandCardStyle:
      handle_card_style_packet(simply, packet);
      return true;
  }
  return false;
}

SimplyUi *simply_ui_create(Simply *simply) {
  SimplyUi *self = malloc(sizeof(*self));
  *self = (SimplyUi) { .window.layer = NULL };

  static const WindowHandlers s_window_handlers = {
    .load = window_load,
    .appear = window_appear,
    .disappear = window_disappear,
    .unload = window_unload,
  };
  self->window.window_handlers = &s_window_handlers;

  simply_window_init(&self->window, simply);
  simply_window_set_background_color(&self->window, GColor8White);

  app_timer_register(10000, (AppTimerCallback) show_welcome_text, self);

  return self;
}

void simply_ui_destroy(SimplyUi *self) {
  if (!self) {
    return;
  }

  simply_ui_clear(self, ~0);

  fonts_unload_custom_font(self->ui_layer.custom_body_font);
  self->ui_layer.custom_body_font = NULL;

  simply_window_deinit(&self->window);

  free(self);
}
