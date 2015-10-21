#pragma once

#include <pebble.h>

/**
 * aplite and SDK 2.9 compatibility utilities
 * These are a collection of types and compatibility macros taken from SDK 3.0.
 * When possible, they are copied directly without modification.
 */

// Compatibility definitions for aplite on 2.9
#if !defined(PBL_PLATFORM_APLITE) && !defined(PBL_PLATFORM_BASALT) && !defined(PBL_PLATFORM_CHALK)

#define PBL_SDK_2

//! The format of a GBitmap can either be 1-bit or 8-bit.
typedef enum GBitmapFormat {
  GBitmapFormat1Bit = 0, //<! 1-bit black and white. 0 = black, 1 = white.
  GBitmapFormat8Bit,      //<! 6-bit color + 2 bit alpha channel. See \ref GColor8 for pixel format.
  GBitmapFormat1BitPalette,
  GBitmapFormat2BitPalette,
  GBitmapFormat4BitPalette,
} GBitmapFormat;

static inline GBitmap *gbitmap_create_blank_with_format(GSize size, GBitmapFormat format) {
  return gbitmap_create_blank(size);
}

#define gbitmap_create_blank gbitmap_create_blank_with_format

#define launch_get_args() ((uint32_t)0)

#endif

// Compatibility definitions for aplite on all versions
#ifndef PBL_COLOR

#define GBitmapFormat8Bit         1
#define GBitmapFormat1BitPalette  2
#define GBitmapFormat2BitPalette  3
#define GBitmapFormat4BitPalette  4

#define GColorWhiteARGB8 ((uint8_t)0b11111111)
#define GColorBlackARGB8 ((uint8_t)0b11000000)
#define GColorClearARGB8 ((uint8_t)0b00000000)

typedef union GColor8 {
  uint8_t argb;
  struct {
    uint8_t b:2; //!< Blue
    uint8_t g:2; //!< Green
    uint8_t r:2; //!< Red
    uint8_t a:2; //!< Alpha. 3 = 100% opaque, 2 = 66% opaque, 1 = 33% opaque, 0 = transparent.
  };
} GColor8;

//! Convenience macro to enable use of SDK 3.0 function to compare equality of two colors.
#define gcolor_equal(a, b) ((a) == (b))

#ifndef graphics_context_set_antialiased
#define graphics_context_set_antialiased(ctx, enable)
#endif

#ifndef gbitmap_create_from_png_data
#define gbitmap_create_from_png_data(png_data, png_data_size) NULL
#endif

//! Convenience function to use SDK 3.0 function to get a `GBitmap`'s `row_size_bytes` field.
#ifndef gbitmap_get_bytes_per_row
#define gbitmap_get_bytes_per_row(bmp) ((bmp)->row_size_bytes)
#endif

//! Convenience function to use SDK 3.0 function to get a `GBitmap`'s `bounds` field.
#ifndef gbitmap_get_bounds
#define gbitmap_get_bounds(bmp) ((bmp)->bounds)
#endif

//! Convenience function to use SDK 3.0 function to get a `GBitmap`'s `addr` field.
#ifndef gbitmap_get_data
#define gbitmap_get_data(bmp) ((bmp)->addr)
#endif

//! Convenience function to use SDK 3.0 function to set a `GBitmap`'s `bounds` field.
#ifndef gbitmap_set_bounds
#define gbitmap_set_bounds(bmp, new_bounds) ((bmp)->bounds = (new_bounds))
#endif

//! Convenience function to use SDK 3.0 function to set a `GBitmap`'s `addr` field.
//! Modified to support row_size_bytes and free_on_destroy.
//! Change to ifndef when SDK 3.0 supports those additional parameters.
#undef gbitmap_set_data
#define gbitmap_set_data(bmp, data, fmt, rsb, fod) ({ \
  __typeof__(bmp) __gbitmap_tmp_bmp = (bmp); \
  __gbitmap_tmp_bmp->addr = (data); \
  __gbitmap_tmp_bmp->is_heap_allocated = (fod); \
  __gbitmap_tmp_bmp->row_size_bytes = (rsb); \
})

#ifndef gbitmap_get_palette
#define gbitmap_get_palette(bitmap) NULL
#endif

#ifndef gbitmap_set_palette
#define gbitmap_set_palette(bitmap, palette, free_on_destroy) \
  ((void)(bitmap), (void)(palette), (void)(free_on_destroy))
#endif

#ifndef gbitmap_get_format
#define gbitmap_get_format(bitmap) \
  (GBitmapFormat1Bit)
#endif

typedef TextLayout GTextAttributes;

#ifndef graphics_text_attributes_create
#define graphics_text_attributes_create() NULL
#endif

#ifndef graphics_text_attributes_destroy
#define graphics_text_attributes_destroy(text_attributes)
#endif

#ifndef graphics_text_attributes_enable_screen_text_flow
#define graphics_text_attributes_enable_screen_text_flow(text_attributes, inset)
#endif

#ifndef graphics_text_attributes_enable_paging
#define graphics_text_attributes_enable_paging(text_attributes, origin_on_screen, page_frame)
#endif

#ifndef graphics_text_layout_get_content_size_with_attributes
#define graphics_text_layout_get_content_size_with_attributes(text, font, box, overflow_mode, \
                                                              alignment, text_attributes) \
    graphics_text_layout_get_content_size(text, font, box, overflow_mode, alignment)
#endif

#ifndef menu_layer_set_normal_colors
#define menu_layer_set_normal_colors(menu_layer, background_color, text_color)
#endif

#ifndef menu_layer_set_highlight_colors
#define menu_layer_set_highlight_colors(menu_layer, background_color, text_color)
#endif

#ifndef menu_cell_layer_is_highlighted
#define menu_cell_layer_is_highlighted(cell_layer) (false)
#endif

//! Convenience macro to use SDK 3.0 function to set a `PropertyAnimation`'s
//! `values.from.grect` field.
#ifndef property_animation_set_from_grect
#define property_animation_set_from_grect(prop_anim, value_ptr) \
  ((prop_anim)->values.from.grect = *(value_ptr))
#endif

//! Convenience macro to use SDK 3.0 function to set a `PropertyAnimation`'s
//! `values.to.grect` field.
#ifndef property_animation_set_to_grect
#define property_animation_set_to_grect(prop_anim, value_ptr) \
  ((prop_anim)->values.to.grect = *(value_ptr))
#endif

#ifndef scroll_layer_set_paging
#define scroll_layer_set_paging(scroll_layer, paging_enabled)
#endif

#endif

// Legacy definitions for basalt on 3.0
// These should eventually be removed in the future
#ifdef PBL_SDK_3

#define window_set_fullscreen(window, fullscreen)

#endif
