#pragma once

#include "util/compat.h"
#include "util/color.h"

#include <pebble.h>

#ifndef PBL_COLOR

#define GCompOpAlphaBlend GCompOpAnd

#else

#define GCompOpAlphaBlend GCompOpSet

#endif

static inline GPoint gpoint_neg(const GPoint a) {
  return GPoint(-a.x, -a.y);
}

static inline GPoint gpoint_add(const GPoint a, const GPoint b) {
  return GPoint(a.x + b.x, a.y + b.y);
}

static inline GPoint gpoint_polar(int32_t angle, int16_t radius) {
  return GPoint(sin_lookup(angle) * radius / TRIG_MAX_RATIO,
                cos_lookup(angle) * radius / TRIG_MAX_RATIO);
}

static inline GRect grect_center_rect(const GRect *rect_a, const GRect *rect_b) {
  return (GRect) {
    .origin = {
      .x = rect_a->origin.x + (rect_a->size.w - rect_b->size.w) / 2,
      .y = rect_a->origin.y + (rect_a->size.h - rect_b->size.h) / 2,
    },
    .size = rect_b->size,
  };
}

static inline void graphics_draw_bitmap_centered(GContext *ctx, GBitmap *bitmap, const GRect frame) {
  GRect bounds = gbitmap_get_bounds(bitmap);
  graphics_draw_bitmap_in_rect(ctx, bitmap, grect_center_rect(&frame, &bounds));
}

static inline void graphics_context_set_alpha_blended(GContext *ctx, bool enable) {
  if (enable) {
    graphics_context_set_compositing_mode(ctx, GCompOpAlphaBlend);
  } else {
    graphics_context_set_compositing_mode(ctx, GCompOpAssign);
  }
}

static inline bool gbitmap_is_palette_black_and_white(GBitmap *bitmap) {
  if (!bitmap || gbitmap_get_format(bitmap) != GBitmapFormat1BitPalette) {
    return false;
  }
  const GColor8 *palette = gbitmap_get_palette(bitmap);
  return (gcolor8_equal(palette[0], GColor8White) && gcolor8_equal(palette[1], GColor8Black)) ||
         (gcolor8_equal(palette[0], GColor8Black) && gcolor8_equal(palette[1], GColor8White));
}
