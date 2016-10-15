#pragma once

#include "simply_window.h"

#include "simply_msg.h"

#include "simply.h"

#include "util/inverter_layer.h"
#include "util/list1.h"
#include "util/color.h"

#include <pebble.h>

#define simply_stage_get_element(self, id) simply_stage_auto_element(self, id, SimplyElementTypeNone)

typedef struct SimplyStageLayer SimplyStageLayer;

typedef struct SimplyStage SimplyStage;

typedef struct SimplyStageItem SimplyStageItem;

typedef enum SimplyElementType SimplyElementType;

enum SimplyElementType {
  SimplyElementTypeNone = 0,
  SimplyElementTypeRect,
  SimplyElementTypeLine,
  SimplyElementTypeCircle,
  SimplyElementTypeRadial,
  SimplyElementTypeText,
  SimplyElementTypeImage,
  SimplyElementTypeInverter,
  SimplyElementTypePath,
};

struct SimplyStageLayer {
  Layer *layer;
  List1Node *elements;
  List1Node *animations;
};

struct SimplyStage {
  SimplyWindow window;
  SimplyStageLayer stage_layer;
};

typedef struct SimplyElementCommon SimplyElementCommon;

struct SimplyElementCommon {
  List1Node node;
  uint32_t id;
  SimplyElementType type;
  GRect frame;
  uint16_t border_width;
  GColor8 background_color;
  GColor8 border_color;
};

typedef struct SimplyElementCommon SimplyElementLine;

typedef struct SimplyElementRect SimplyElementRect;

struct SimplyElementRect {
  SimplyElementCommon common;
  uint16_t radius;
};

typedef struct SimplyElementRect SimplyElementCircle;

typedef struct SimplyElementRadial SimplyElementRadial;

struct SimplyElementRadial {
  SimplyElementRect rect;
  uint16_t angle;
  uint16_t angle2;
};

typedef struct SimplyElementText SimplyElementText;

struct SimplyElementText {
  SimplyElementRect rect;
  char *text;
  GFont font;
  TimeUnits time_units:8;
  GColor8 text_color;
  GTextOverflowMode overflow_mode:2;
  GTextAlignment alignment:2;
};

typedef struct SimplyElementImage SimplyElementImage;

struct SimplyElementImage {
  SimplyElementRect rect;
  uint32_t image;
  GCompOp compositing;
};

typedef struct SimplyElementInverter SimplyElementInverter;

struct SimplyElementInverter {
  SimplyElementCommon common;
  InverterLayer *inverter_layer;
};

typedef struct SimplyAnimation SimplyAnimation;

struct SimplyAnimation {
  List1Node node;
  SimplyStage *stage;
  SimplyElementCommon *element;
  PropertyAnimation *animation;
  uint32_t duration;
  AnimationCurve curve;
};

typedef struct SimplyElementPath SimplyElementPath;

struct SimplyElementPath {
  SimplyElementCommon common;
  GPath* path;
};

SimplyStage *simply_stage_create(Simply *simply);
void simply_stage_destroy(SimplyStage *self);

bool simply_stage_handle_packet(Simply *simply, Packet *packet);
