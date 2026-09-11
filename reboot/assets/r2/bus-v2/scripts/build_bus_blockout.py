import bpy
import json
import math
from pathlib import Path
from mathutils import Vector

BASE = Path.home() / "Projects/adutha-stoppil-r2-authoring"
SOURCE = BASE / "source" / "bus_v2_blockout.blend"
EXPORT = BASE / "exports" / "bus_v2_blockout.glb"
MANIFEST = BASE / "exports" / "bus_v2_blockout_manifest.json"
PREVIEWS = BASE / "previews"

# Runtime contract after glTF conversion: +X right, +Y up, +Z forward.
# Blender authoring: +X right, +Z up, -Y forward.
LENGTH = 10.95
WIDTH = 2.55
HEIGHT = 3.25
WHEELBASE = 5.45
WHEEL_RADIUS = 0.48
FRONT_OVERHANG = 2.40
REAR_OVERHANG = 3.10
FRONT_AXLE_Y = -WHEELBASE / 2
REAR_AXLE_Y = WHEELBASE / 2
FRONT_END_Y = FRONT_AXLE_Y - FRONT_OVERHANG
REAR_END_Y = REAR_AXLE_Y + REAR_OVERHANG
BODY_CENTER_Y = (FRONT_END_Y + REAR_END_Y) / 2

def clean_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        pass


def collection(name):
    found = bpy.data.collections.get(name)
    if found:
        return found
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col


def move_to_collection(obj, col):
    for current in list(obj.users_collection):
        current.objects.unlink(obj)
    col.objects.link(obj)


def make_material(name, color, roughness=0.7, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color[:3], color[3] if len(color) > 3 else 1.0)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = mat.diffuse_color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat

def empty(name, location=(0, 0, 0), parent=None, col=None, display="PLAIN_AXES", size=0.25):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = display
    obj.empty_display_size = size
    obj.location = location
    (col or bpy.context.scene.collection).objects.link(obj)
    if parent:
        obj.parent = parent
    return obj


def cube(name, location, dimensions, material, col, parent=None, bevel=0.025):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        obj.data.materials.append(material)
    if bevel > 0:
        mod = obj.modifiers.new("soft_edges", "BEVEL")
        mod.width = bevel
        mod.segments = 2
    move_to_collection(obj, col)
    if parent:
        obj.parent = parent
    return obj


def cylinder(name, location, radius, depth, material, col, parent=None, rotation=(0, 0, 0), vertices=20):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    if material:
        obj.data.materials.append(material)
    move_to_collection(obj, col)
    if parent:
        obj.parent = parent
    return obj

def arch_strip(name, x, y, z, radius, width, depth, material, col, parent=None, segments=24):
    verts = []
    faces = []
    r_outer = radius + width / 2
    r_inner = radius - width / 2
    for xi in (-depth / 2, depth / 2):
        for i in range(segments + 1):
            t = math.pi * i / segments
            for r in (r_outer, r_inner):
                verts.append((x + xi, y + math.cos(t) * r, z + math.sin(t) * r))
    ring = (segments + 1) * 2
    for side in range(2):
        base = side * ring
        for i in range(segments):
            a = base + i * 2
            b = a + 1
            c = a + 3
            d = a + 2
            faces.append((a, b, c, d))
    for i in range(segments):
        a0 = i * 2
        a1 = (i + 1) * 2
        b0 = ring + a0
        b1 = ring + a1
        faces.append((a0, a1, b1, b0))
        faces.append((a0 + 1, b0 + 1, b1 + 1, a1 + 1))
    faces.extend([(0, ring, ring + 1, 1), (segments * 2, segments * 2 + 1, ring + segments * 2 + 1, ring + segments * 2)])
    mesh = bpy.data.meshes.new(name + '_MESH')
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    col.objects.link(obj)
    if material:
        obj.data.materials.append(material)
    if parent:
        obj.parent = parent
    return obj


def build_bus():
    clean_scene()
    cols = {name: collection(name) for name in [
        "BODY_EXT", "BODY_INT", "WHEELS", "DOOR", "WIPERS", "LIGHTS",
        "DASH", "SEATS", "RAILS", "GLASS", "COLLISION_REF", "CAMERA_ANCHORS", "PREVIEW"
    ]}

    mats = {
        "red": make_material("MAT_BODY_RED", (0.36, 0.045, 0.035, 1), 0.74),
        "cream": make_material("MAT_BODY_CREAM", (0.67, 0.54, 0.31, 1), 0.78),
        "trim": make_material("MAT_BODY_DARK_TRIM", (0.035, 0.045, 0.05, 1), 0.72),
        "glass": make_material("MAT_GLASS", (0.035, 0.075, 0.09, 1), 0.18, 0.05),
        "rubber": make_material("MAT_RUBBER", (0.018, 0.02, 0.022, 1), 0.92),
        "metal": make_material("MAT_METAL_BARE", (0.22, 0.24, 0.25, 1), 0.38, 0.55),
        "interior": make_material("MAT_INTERIOR_BLUEGREY", (0.18, 0.25, 0.27, 1), 0.86),
        "rail": make_material("MAT_RAIL_YELLOW", (0.64, 0.43, 0.08, 1), 0.62, 0.1),
        "seat": make_material("MAT_SEAT_DARK", (0.07, 0.09, 0.085, 1), 0.9),
        "lens": make_material("MAT_LIGHT_LENS", (0.85, 0.78, 0.55, 1), 0.28),
        "board": make_material("MAT_DESTINATION_BOARD", (0.055, 0.065, 0.055, 1), 0.6),
    }

    root = empty("BUS_ROOT", col=cols["BODY_EXT"], size=0.4)
    body = empty("BODY_VISUAL", parent=root, col=cols["BODY_EXT"], size=0.32)

    # Structural floor/lower body. The upper cabin is intentionally open between pillars.
    cube("BODY_LOWER", (0, BODY_CENTER_Y, 0.94), (2.46, LENGTH - 0.08, 0.82), mats["red"], cols["BODY_EXT"], body, 0.08)
    cube("BODY_FLOOR", (0, BODY_CENTER_Y, 0.55), (2.28, LENGTH - 0.28, 0.16), mats["interior"], cols["BODY_INT"], body, 0.025)
    cube("BODY_ROOF", (0, BODY_CENTER_Y, 3.12), (2.48, LENGTH - 0.10, 0.22), mats["cream"], cols["BODY_EXT"], body, 0.11)
    cube("BELT_R", (1.235, BODY_CENTER_Y, 1.50), (0.10, LENGTH - 0.20, 0.24), mats["cream"], cols["BODY_EXT"], body, 0.025)
    cube("BELT_L", (-1.235, BODY_CENTER_Y, 1.50), (0.10, LENGTH - 0.20, 0.24), mats["cream"], cols["BODY_EXT"], body, 0.025)

    # Front/rear fascia establish the tall utility-bus silhouette without copying a production face.
    cube("FRONT_LOWER", (0, FRONT_END_Y + 0.10, 1.15), (2.48, 0.18, 1.25), mats["red"], cols["BODY_EXT"], body, 0.06)
    cube("FRONT_HEADER", (0, FRONT_END_Y + 0.08, 2.92), (2.42, 0.15, 0.42), mats["cream"], cols["BODY_EXT"], body, 0.09)
    cube("REAR_PANEL", (0, REAR_END_Y - 0.10, 1.70), (2.48, 0.18, 2.75), mats["red"], cols["BODY_EXT"], body, 0.06)
    cube("FRONT_BUMPER", (0, FRONT_END_Y - 0.02, 0.50), (2.32, 0.22, 0.22), mats["trim"], cols["BODY_EXT"], body, 0.05)
    cube("REAR_BUMPER", (0, REAR_END_Y + 0.02, 0.48), (2.30, 0.22, 0.20), mats["trim"], cols["BODY_EXT"], body, 0.04)

    # Split windscreen and destination board.
    for x in (-0.61, 0.61):
        cube(f"WINDSHIELD_{'L' if x < 0 else 'R'}", (x, FRONT_END_Y - 0.015, 2.18), (1.10, 0.045, 1.18), mats["glass"], cols["GLASS"], body, 0.035)
    cube("DESTINATION_BOARD", (0, FRONT_END_Y - 0.035, 2.91), (1.52, 0.05, 0.25), mats["board"], cols["BODY_EXT"], body, 0.025)
    cube("FRONT_BELT", (0, FRONT_END_Y - 0.04, 1.48), (2.34, 0.06, 0.20), mats["cream"], cols["BODY_EXT"], body, 0.025)
    cube("FRONT_GRILLE", (0, FRONT_END_Y - 0.06, 0.92), (1.10, 0.055, 0.42), mats["trim"], cols["BODY_EXT"], body, 0.035)
    cube("REAR_BELT", (0, REAR_END_Y + 0.04, 1.48), (2.34, 0.06, 0.20), mats["cream"], cols["BODY_EXT"], body, 0.025)
    for x in (-0.60, 0.60):
        cube(f"REAR_WINDOW_{'L' if x < 0 else 'R'}", (x, REAR_END_Y + 0.055, 2.22), (1.04, 0.045, 0.88), mats["glass"], cols["GLASS"], body, 0.028)
    cube("REAR_ROUTE_PANEL", (0, REAR_END_Y + 0.060, 2.84), (1.42, 0.05, 0.22), mats["board"], cols["BODY_EXT"], body, 0.025)
    cube("REAR_ENGINE_VENT", (0, REAR_END_Y + 0.065, 1.03), (0.95, 0.05, 0.26), mats["trim"], cols["BODY_EXT"], body, 0.025)

    # Bevelled front corner caps reduce the generic box read without copying a production face.
    for x in (-1.18, 1.18):
        cube(f"FRONT_CORNER_CAP_{'L' if x < 0 else 'R'}", (x, FRONT_END_Y + 0.01, 2.18), (0.18, 0.18, 1.42), mats["cream"], cols["BODY_EXT"], body, 0.085)

    # Large external mirrors matter to the silhouette at chase-camera distance.
    for side_x, side in ((-1.54, "L"), (1.54, "R")):
        cube(f"MIRROR_{side}", (side_x, -4.58, 2.38), (0.18, 0.12, 0.34), mats["trim"], cols["BODY_EXT"], body, 0.035)
        stem = cylinder(f"MIRROR_STEM_{side}", (side_x * 0.91, -4.62, 2.29), 0.018, 0.42, mats["metal"], cols["BODY_EXT"], body, (0, math.pi / 2, 0), 10)
        stem.rotation_euler = (0, math.pi / 2, 0)

    # Side glazing/window rhythm. Front-left bay stays open for the passenger door.
    window_centres = [-4.05, -3.05, -2.05, -1.05, -0.05, 0.95, 1.95, 2.95, 3.95, 4.85]
    for side_x, side_name in ((1.255, "R"), (-1.255, "L")):
        for i, y in enumerate(window_centres, start=1):
            if side_name == "L" and y < -3.0:
                continue
            cube(f"SIDE_WINDOW_{side_name}_{i:02d}", (side_x, y, 2.25), (0.045, 0.82, 1.10), mats["glass"], cols["GLASS"], body, 0.012)
        for i, y in enumerate([-4.55, -3.55, -2.55, -1.55, -0.55, 0.45, 1.45, 2.45, 3.45, 4.45, 5.25], start=1):
            if side_name == "L" and y < -3.1:
                continue
            cube(f"PILLAR_{side_name}_{i:02d}", (side_x * 0.992, y, 2.25), (0.10, 0.10, 1.38), mats["cream"], cols["BODY_EXT"], body, 0.018)

    # Split front door: lightweight framed leaves with glazing instead of opaque slabs.
    door_pivot = empty("DOOR_FRONT_PIVOT", (-1.29, -4.72, 1.62), body, cols["DOOR"], "ARROWS", 0.22)
    for leaf_i, local_y in enumerate((0.29, 0.85), start=1):
        leaf_root = empty(f"DOOR_FRONT_LEAF_{leaf_i}", (0, local_y, 0), door_pivot, cols["DOOR"], "PLAIN_AXES", 0.10)
        cube(f"DOOR_FRONT_LEAF_{leaf_i}_LOWER", (0, 0, -0.57), (0.075, 0.49, 0.72), mats["red"], cols["DOOR"], leaf_root, 0.025)
        cube(f"DOOR_FRONT_LEAF_{leaf_i}_GLASS", (0, 0, 0.38), (0.055, 0.43, 0.98), mats["glass"], cols["DOOR"], leaf_root, 0.016)
        cube(f"DOOR_FRONT_LEAF_{leaf_i}_TOP", (0, 0, 0.91), (0.078, 0.50, 0.08), mats["trim"], cols["DOOR"], leaf_root, 0.018)
        for edge_y in (-0.235, 0.235):
            cube(f"DOOR_FRONT_LEAF_{leaf_i}_FRAME_{'A' if edge_y < 0 else 'B'}", (0, edge_y, 0.37), (0.08, 0.055, 1.10), mats["trim"], cols["DOOR"], leaf_root, 0.014)
    for step_i, (y, z, width) in enumerate([(-4.25, 0.45, 0.72), (-4.12, 0.62, 0.82), (-3.99, 0.79, 0.92)], start=1):
        cube(f"DOOR_STEP_{step_i}", (-0.82, y, z), (0.82, 0.34, 0.12), mats["metal"], cols["BODY_INT"], body, 0.02)

    # Wheel-arch trim gives the side silhouette a proper bus stance even in blockout.
    for axle_y, axle_name in ((FRONT_AXLE_Y, "FRONT"), (REAR_AXLE_Y, "REAR")):
        for side_x, side_name in ((-1.255, "L"), (1.255, "R")):
            arch_strip(f"WHEEL_ARCH_{axle_name}_{side_name}", side_x, axle_y, 0.48, 0.60, 0.075, 0.055, mats["trim"], cols["BODY_EXT"], body, 24)

    # Runtime wheel nodes: origins exactly at axle centres.
    wheel_specs = {
        "WHEEL_FL": (-1.01, FRONT_AXLE_Y, WHEEL_RADIUS),
        "WHEEL_FR": (1.01, FRONT_AXLE_Y, WHEEL_RADIUS),
        "WHEEL_RL": (-1.01, REAR_AXLE_Y, WHEEL_RADIUS),
        "WHEEL_RR": (1.01, REAR_AXLE_Y, WHEEL_RADIUS),
    }
    for name, pos in wheel_specs.items():
        pivot = empty(name, pos, root, cols["WHEELS"], "CIRCLE", 0.55)
        tyre = cylinder(f"{name}_TYRE", (0, 0, 0), WHEEL_RADIUS, 0.31, mats["rubber"], cols["WHEELS"], pivot, (0, math.pi / 2, 0), 28)
        tyre.location = (0, 0, 0)
        hub = cylinder(f"{name}_HUB", (0, 0, 0), 0.20, 0.325, mats["metal"], cols["WHEELS"], pivot, (0, math.pi / 2, 0), 20)
        hub.location = (0, 0, 0)

    # Separately addressable lighting nodes.
    for name, x, y, z in [
        ("LIGHT_HEAD_L", -0.72, FRONT_END_Y - 0.055, 0.92),
        ("LIGHT_HEAD_R", 0.72, FRONT_END_Y - 0.055, 0.92),
        ("LIGHT_BRAKE_L", -0.76, REAR_END_Y + 0.055, 0.90),
        ("LIGHT_BRAKE_R", 0.76, REAR_END_Y + 0.055, 0.90),
        ("INDICATOR_FL", -1.02, FRONT_END_Y - 0.06, 1.14),
        ("INDICATOR_FR", 1.02, FRONT_END_Y - 0.06, 1.14),
        ("INDICATOR_RL", -1.02, REAR_END_Y + 0.06, 1.12),
        ("INDICATOR_RR", 1.02, REAR_END_Y + 0.06, 1.12),
    ]:
        cube(name, (x, y, z), (0.24, 0.08, 0.18), mats["lens"], cols["LIGHTS"], body, 0.035)

    # Wipers and steering are authored as pivots with child geometry.
    for name, x, angle in (("WIPER_L_PIVOT", -0.48, -0.30), ("WIPER_R_PIVOT", 0.48, 0.30)):
        pivot = empty(name, (x, FRONT_END_Y - 0.075, 1.69), body, cols["WIPERS"], "ARROWS", 0.16)
        blade = cube(f"{name}_BLADE", (0, 0, 0.43), (0.045, 0.055, 0.86), mats["trim"], cols["WIPERS"], pivot, 0.01)
        blade.location = (0, 0, 0.43)
        blade.rotation_euler[1] = angle

    steering = empty("STEERING_WHEEL_PIVOT", (0.72, -4.37, 1.39), body, cols["DASH"], "CIRCLE", 0.24)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.24, minor_radius=0.026, major_segments=24, minor_segments=8, location=(0, 0, 0))
    steering_mesh = bpy.context.object
    steering_mesh.name = "STEERING_WHEEL_MESH"
    steering_mesh.rotation_euler = (math.radians(72), 0, 0)
    steering_mesh.data.materials.append(mats["trim"])
    move_to_collection(steering_mesh, cols["DASH"])
    steering_mesh.parent = steering
    steering_mesh.location = (0, 0, 0)

    cube("DASH_BLOCK", (0.60, -4.63, 1.12), (1.05, 0.58, 0.54), mats["trim"], cols["DASH"], body, 0.05)
    cube("DRIVER_SEAT_BASE", (0.70, -3.95, 0.88), (0.58, 0.58, 0.18), mats["seat"], cols["SEATS"], body, 0.05)
    cube("DRIVER_SEAT_BACK", (0.70, -3.70, 1.27), (0.58, 0.16, 0.78), mats["seat"], cols["SEATS"], body, 0.05)
    cube("EXAMINER_SEAT_BASE", (0.70, -2.95, 0.88), (0.58, 0.58, 0.18), mats["seat"], cols["SEATS"], body, 0.05)
    cube("EXAMINER_SEAT_BACK", (0.70, -2.70, 1.27), (0.58, 0.16, 0.78), mats["seat"], cols["SEATS"], body, 0.05)

    # Simplified passenger benches; one gameplay socket per bench at blockout stage.
    seat_rows = [-1.80, -0.75, 0.30, 1.35, 2.40, 3.45, 4.50]
    seat_index = 1
    for row_y in seat_rows:
        for x in (-0.72, 0.72):
            side = "L" if x < 0 else "R"
            cube(f"PAX_SEAT_{side}_{seat_index:02d}_BASE", (x, row_y, 0.88), (0.82, 0.62, 0.18), mats["seat"], cols["SEATS"], body, 0.045)
            cube(f"PAX_SEAT_{side}_{seat_index:02d}_BACK", (x, row_y + 0.26, 1.28), (0.82, 0.16, 0.82), mats["interior"], cols["SEATS"], body, 0.045)
            empty(f"SEAT_{seat_index:02d}", (x, row_y - 0.02, 1.02), body, cols["SEATS"], "CIRCLE", 0.12)
            seat_index += 1

    # Standing/aisle navigation sockets.
    for i, y in enumerate([-2.15, -1.0, 0.3, 1.6, 2.9, 4.2], start=1):
        empty(f"STAND_{i:02d}", (0, y, 0.60), body, cols["BODY_INT"], "CIRCLE", 0.12)
    for name, y in (("SOCKET_AISLE_FRONT", -2.25), ("SOCKET_AISLE_MID", 0.60), ("SOCKET_AISLE_REAR", 4.15)):
        empty(name, (0, y, 0.62), body, cols["BODY_INT"], "ARROWS", 0.18)

    empty("SOCKET_DRIVER_HEAD", (0.70, -3.92, 1.66), body, cols["BODY_INT"], "SPHERE", 0.13)
    empty("SOCKET_EXAMINER_HEAD", (0.70, -2.92, 1.66), body, cols["BODY_INT"], "SPHERE", 0.13)
    empty("SOCKET_CONDUCTOR_HOME", (-0.48, -3.18, 0.62), body, cols["BODY_INT"], "ARROWS", 0.16)
    empty("SOCKET_DOOR_ENTRY", (-0.92, -4.20, 0.48), body, cols["DOOR"], "ARROWS", 0.16)

    # Overhead rails and luggage-rack language from Kerala public-bus interiors.
    for x in (-0.82, 0.82):
        rail = cylinder(f"RAIL_LONG_{'L' if x < 0 else 'R'}", (x, 0.65, 2.66), 0.026, 8.5, mats["rail"], cols["RAILS"], body, (math.pi / 2, 0, 0), 14)
        rail.rotation_euler = (math.pi / 2, 0, 0)
    for i, y in enumerate([-2.35, -0.5, 1.35, 3.2, 4.65], start=1):
        for x in (-0.96, 0.96):
            cylinder(f"RAIL_POLE_{i}_{'L' if x < 0 else 'R'}", (x, y, 1.67), 0.028, 2.0, mats["rail"], cols["RAILS"], body, (0, 0, 0), 14)
    cube("LUGGAGE_RACK_L", (-1.00, 0.65, 2.58), (0.42, 8.30, 0.055), mats["metal"], cols["RAILS"], body, 0.015)
    cube("LUGGAGE_RACK_R", (1.00, 0.65, 2.58), (0.42, 8.30, 0.055), mats["metal"], cols["RAILS"], body, 0.015)

    # Runtime camera/socket anchors. Rotations will be refined after the first integration capture.
    camera_sockets = {
        "CAM_CHASE_TARGET": (0, 0.55, 1.65),
        "CAM_FRONT_3Q": (-4.4, -7.2, 3.15),
        "CAM_SIDE_STOP": (-6.2, -0.2, 2.25),
        "CAM_INTERIOR_DRIVER": (-0.20, -4.12, 1.72),
        "CAM_INTERIOR_EXAMINER": (-0.05, -2.85, 1.72),
        "CAM_INTERIOR_TWO_SHOT": (-0.85, -3.45, 1.82),
        "CAM_DOOR_BOARDING": (-2.75, -4.05, 1.55),
    }
    for name, pos in camera_sockets.items():
        empty(name, pos, body, cols["CAMERA_ANCHORS"], "CONE", 0.22)

    collision = cube("COLLISION_REFERENCE_ONLY", (0, -0.08, 1.10), (2.32, 10.36, 1.10), None, cols["COLLISION_REF"], root, 0)
    collision.display_type = "WIRE"
    collision.hide_render = True
    return root, body, cols

def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_preview_scene(cols):
    preview_mat = make_material("PREVIEW_FLOOR", (0.095, 0.105, 0.11, 1), 0.94)
    floor = cube("PREVIEW_FLOOR", (0, 0.5, -0.08), (20, 24, 0.12), preview_mat, cols["PREVIEW"], None, 0)
    floor.hide_select = True

    # Simple review mannequins prove headroom and driver/examiner camera sightlines.
    dummy_driver = make_material("PREVIEW_DRIVER", (0.16, 0.30, 0.42, 1), 0.82)
    dummy_examiner = make_material("PREVIEW_EXAMINER", (0.34, 0.24, 0.13, 1), 0.82)
    for label, x, y, mat in (("DRIVER", 0.70, -3.92, dummy_driver), ("EXAMINER", 0.70, -2.92, dummy_examiner)):
        cube(f"PREVIEW_{label}_TORSO", (x, y + 0.03, 1.30), (0.42, 0.34, 0.62), mat, cols["PREVIEW"], None, 0.08)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.16, location=(x, y, 1.68))
        head = bpy.context.object
        head.name = f"PREVIEW_{label}_HEAD"
        head.data.materials.append(mat)
        move_to_collection(head, cols["PREVIEW"])

    bpy.ops.object.light_add(type="AREA", location=(-5.5, -5.5, 8.5))
    key = bpy.context.object
    key.name = "PREVIEW_KEY"
    key.data.energy = 1500
    key.data.shape = "DISK"
    key.data.size = 6.0
    look_at(key, (0, 0, 1.3))
    move_to_collection(key, cols["PREVIEW"])

    bpy.ops.object.light_add(type="AREA", location=(5.0, 3.5, 5.0))
    fill = bpy.context.object
    fill.name = "PREVIEW_FILL"
    fill.data.energy = 850
    fill.data.size = 5.0
    look_at(fill, (0, 0.5, 1.5))
    move_to_collection(fill, cols["PREVIEW"])

    bpy.ops.object.light_add(type="AREA", location=(0, 5.8, 6.5))
    rim = bpy.context.object
    rim.name = "PREVIEW_RIM"
    rim.data.energy = 1000
    rim.data.size = 4.0
    look_at(rim, (0, 1.0, 1.8))
    move_to_collection(rim, cols["PREVIEW"])

def render_previews(cols):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 960
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.world.color = (0.035, 0.045, 0.055)

    bpy.ops.object.camera_add(location=(0, 0, 0))
    cam = bpy.context.object
    cam.name = "PREVIEW_CAMERA"
    cam.data.lens = 47
    move_to_collection(cam, cols["PREVIEW"])
    scene.camera = cam

    views = [
        ("01_rear_chase_3q.png", (4.8, 10.8, 4.1), (0, 3.25, 1.45), 58),
        ("02_front_3q.png", (-4.5, -10.4, 3.7), (0, -3.55, 1.45), 58),
        ("03_interior_two_shot.png", (-0.92, -1.55, 2.02), (0.62, -3.52, 1.42), 46),
        ("04_door_side.png", (-4.35, -4.20, 1.82), (-0.98, -4.12, 1.34), 48),
    ]
    PREVIEWS.mkdir(parents=True, exist_ok=True)
    for filename, location, target, lens in views:
        cam.location = location
        cam.data.lens = lens
        look_at(cam, target)
        scene.render.filepath = str(PREVIEWS / filename)
        bpy.ops.render.render(write_still=True)

def descendants(parent):
    result = []
    stack = list(parent.children)
    while stack:
        obj = stack.pop()
        result.append(obj)
        stack.extend(list(obj.children))
    return result


def triangle_count(objects):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    total = 0
    for obj in objects:
        if obj.type != "MESH":
            continue
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        mesh.calc_loop_triangles()
        total += len(mesh.loop_triangles)
        evaluated.to_mesh_clear()
    return total


def export_bus(root, collision_collection):
    candidates = [root] + descendants(root)
    export_objects = [obj for obj in candidates if collision_collection not in obj.users_collection]
    bpy.ops.object.select_all(action="DESELECT")
    for obj in export_objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = root
    EXPORT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(EXPORT), export_format="GLB", use_selection=True,
        export_yup=True, export_apply=True, export_animations=False,
    )
    return export_objects

def write_manifest(export_objects):
    required = [
        "BUS_ROOT", "BODY_VISUAL", "WHEEL_FL", "WHEEL_FR", "WHEEL_RL", "WHEEL_RR",
        "DOOR_FRONT_PIVOT", "WIPER_L_PIVOT", "WIPER_R_PIVOT", "STEERING_WHEEL_PIVOT",
        "LIGHT_HEAD_L", "LIGHT_HEAD_R", "LIGHT_BRAKE_L", "LIGHT_BRAKE_R",
        "INDICATOR_FL", "INDICATOR_FR", "INDICATOR_RL", "INDICATOR_RR",
        "SOCKET_DRIVER_HEAD", "SOCKET_EXAMINER_HEAD", "SOCKET_CONDUCTOR_HOME",
        "SOCKET_DOOR_ENTRY", "SOCKET_AISLE_FRONT", "SOCKET_AISLE_MID", "SOCKET_AISLE_REAR",
        "CAM_CHASE_TARGET", "CAM_FRONT_3Q", "CAM_SIDE_STOP", "CAM_INTERIOR_DRIVER",
        "CAM_INTERIOR_EXAMINER", "CAM_INTERIOR_TWO_SHOT", "CAM_DOOR_BOARDING",
    ]
    names = {obj.name for obj in export_objects}
    missing = [name for name in required if name not in names]
    mesh_objects = [obj for obj in export_objects if obj.type == "MESH"]
    corners = []
    for obj in mesh_objects:
        corners.extend([obj.matrix_world @ Vector(corner) for corner in obj.bound_box])
    mins = [min(v[i] for v in corners) for i in range(3)]
    maxs = [max(v[i] for v in corners) for i in range(3)]
    payload = {
        "asset": "bus_v2_blockout",
        "authoring_axes": "+X right, +Z up, -Y forward",
        "runtime_axes": "+X right, +Y up, +Z forward",
        "dimensions_target_m": {"length": LENGTH, "width": WIDTH, "height": HEIGHT, "wheelbase": WHEELBASE},
        "blender_bounds_min": mins,
        "blender_bounds_max": maxs,
        "object_count": len(export_objects),
        "mesh_count": len(mesh_objects),
        "triangle_count": triangle_count(export_objects),
        "required_nodes_missing": missing,
        "required_nodes_ok": not missing,
    }
    MANIFEST.write_text(json.dumps(payload, indent=2))
    return payload

def main():
    SOURCE.parent.mkdir(parents=True, exist_ok=True)
    EXPORT.parent.mkdir(parents=True, exist_ok=True)
    PREVIEWS.mkdir(parents=True, exist_ok=True)
    root, _body, cols = build_bus()
    add_preview_scene(cols)
    render_previews(cols)
    export_objects = export_bus(root, cols["COLLISION_REF"])
    manifest = write_manifest(export_objects)
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))
    print("R2_BLOCKOUT_OK")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
