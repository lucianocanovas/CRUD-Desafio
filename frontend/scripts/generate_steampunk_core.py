import bpy
import bmesh
import math
import mathutils
import os

# Reset scene
bpy.ops.wm.read_factory_settings(use_empty=True)

def create_pbr_material(name, base_color, metallic=0.92, roughness=0.28):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
    return mat

mat_brass = create_pbr_material("Brass", (0.82, 0.60, 0.26), metallic=0.94, roughness=0.26)
mat_copper = create_pbr_material("Copper", (0.76, 0.39, 0.22), metallic=0.92, roughness=0.30)
mat_bronze = create_pbr_material("Bronze", (0.58, 0.41, 0.22), metallic=0.90, roughness=0.34)
mat_dark_steel = create_pbr_material("DarkSteel", (0.22, 0.20, 0.19), metallic=0.88, roughness=0.38)

MODULE = 0.24  # Pitch module so all meshing gears share identical tooth size

def create_precision_gear(
    name,
    num_teeth,
    thickness=0.32,
    spokes=6,
    mat=mat_brass,
    location=(0.0, 0.0, 0.0)
):
    """
    Creates an involute-style gear centered at local (0,0,0) in the X-Y plane,
    with its rotation axle along the Z axis.
    At local angle 0, a tooth tip is centered at +X (angle = 0).
    """
    pitch_radius = 0.5 * MODULE * num_teeth
    outer_radius = pitch_radius + 0.82 * MODULE
    root_radius = pitch_radius - 1.02 * MODULE
    rim_inner_radius = root_radius - 0.32
    hub_radius = max(0.32, rim_inner_radius * 0.34)

    mesh = bpy.data.meshes.new(name + "_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = location

    bm = bmesh.new()
    half_t = thickness * 0.5

    # 8 vertices per tooth period to form tapered trapezoidal involute teeth:
    #Offsets within one tooth period [-0.5, +0.5] * dtheta:
    # 0: -0.50 (valley center)
    # 1: -0.34 (valley end / root flank start)
    # 2: -0.15 (tooth tip start)
    # 3:  0.00 (tooth tip center)
    # 4: +0.15 (tooth tip end)
    # 5: +0.34 (root flank end / valley start)
    profile_Points = [
        (-0.50, root_radius),
        (-0.34, root_radius),
        (-0.15, outer_radius),
        ( 0.00, outer_radius),
        ( 0.15, outer_radius),
        ( 0.34, root_radius),
    ]

    pts_per_tooth = len(profile_Points)
    total_pts = num_teeth * pts_per_tooth
    dtheta = (2.0 * math.pi) / num_teeth

    top_outer = []
    bot_outer = []
    top_inner = []
    bot_inner = []

    for t in range(num_teeth):
        base_angle = t * dtheta
        for frac, rad in profile_Points:
            ang = base_angle + frac * dtheta
            ca = math.cos(ang)
            sa = math.sin(ang)

            top_outer.append(bm.verts.new((rad * ca, rad * sa, half_t)))
            bot_outer.append(bm.verts.new((rad * ca, rad * sa, -half_t)))
            top_inner.append(bm.verts.new((rim_inner_radius * ca, rim_inner_radius * sa, half_t)))
            bot_inner.append(bm.verts.new((rim_inner_radius * ca, rim_inner_radius * sa, -half_t)))

    bm.verts.ensure_lookup_table()

    for i in range(total_pts):
        nxt = (i + 1) % total_pts
        bm.faces.new((bot_outer[i], bot_outer[nxt], top_outer[nxt], top_outer[i]))
        bm.faces.new((top_inner[i], top_inner[nxt], bot_inner[nxt], bot_inner[i]))
        bm.faces.new((top_inner[i], top_outer[i], top_outer[nxt], top_inner[nxt]))
        bm.faces.new((bot_outer[i], bot_inner[i], bot_inner[nxt], bot_outer[nxt]))

    # Central Hub Cylinder
    bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        cap_tris=False,
        segments=28,
        radius1=hub_radius,
        radius2=hub_radius,
        depth=thickness * 1.35
    )

    # Axle Pin
    bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        cap_tris=False,
        segments=20,
        radius1=hub_radius * 0.42,
        radius2=hub_radius * 0.42,
        depth=thickness * 2.2
    )

    # Spokes
    if rim_inner_radius > hub_radius + 0.15:
        spoke_len = (rim_inner_radius - hub_radius) + 0.12
        mid_r = hub_radius * 0.85 + spoke_len * 0.5
        for s in range(spokes):
            ang = (2.0 * math.pi * s) / spokes
            ret = bmesh.ops.create_cube(bm, size=1.0)
            s_verts = ret["verts"]
            bmesh.ops.scale(
                bm,
                vec=(spoke_len, max(0.11, pitch_radius * 0.075), thickness * 0.65),
                verts=s_verts
            )
            rot_m = mathutils.Matrix.Rotation(ang, 3, 'Z')
            bmesh.ops.rotate(bm, matrix=rot_m, verts=s_verts)
            bmesh.ops.translate(
                bm,
                vec=(mid_r * math.cos(ang), mid_r * math.sin(ang), 0.0),
                verts=s_verts
            )

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    obj.data.materials.append(mat)
    return obj, pitch_radius

# ==============================================================================
# BUILD CONNECTED CLOCKWORK GEAR TRAIN (Exact Pitch Distances D = R_a + R_b)
# ==============================================================================

# Gear 1: Primary Driver (24 teeth, R = 2.88)
x1, y1, z1 = -1.65, -0.25, 0.0
_, r1 = create_precision_gear("Gear_01", 24, thickness=0.34, spokes=6, mat=mat_brass, location=(x1, y1, z1))

# Gear 2: Meshed with Gear 1 at angle +15 deg (16 teeth, R = 1.92)
alpha_12 = math.radians(15.0)
r2 = 0.5 * MODULE * 16
d12 = r1 + r2
x2 = x1 + d12 * math.cos(alpha_12)
y2 = y1 + d12 * math.sin(alpha_12)
create_precision_gear("Gear_02", 16, thickness=0.34, spokes=5, mat=mat_copper, location=(x2, y2, z1))

# Gear 3: Meshed with Gear 2 at angle +72 deg (12 teeth, R = 1.44)
alpha_23 = math.radians(72.0)
r3 = 0.5 * MODULE * 12
d23 = r2 + r3
x3 = x2 + d23 * math.cos(alpha_23)
y3 = y2 + d23 * math.sin(alpha_23)
create_precision_gear("Gear_03", 12, thickness=0.34, spokes=4, mat=mat_brass, location=(x3, y3, z1))

# Gear 4: Meshed with Gear 2 at angle -52 deg (20 teeth, R = 2.40)
alpha_24 = math.radians(-52.0)
r4 = 0.5 * MODULE * 20
d24 = r2 + r4
x4 = x2 + d24 * math.cos(alpha_24)
y4 = y2 + d24 * math.sin(alpha_24)
create_precision_gear("Gear_04", 20, thickness=0.34, spokes=6, mat=mat_bronze, location=(x4, y4, z1))

# Gear 5: Meshed with Gear 1 at angle +122 deg (14 teeth, R = 1.68)
alpha_15 = math.radians(122.0)
r5 = 0.5 * MODULE * 14
d15 = r1 + r5
x5 = x1 + d15 * math.cos(alpha_15)
y5 = y1 + d15 * math.sin(alpha_15)
create_precision_gear("Gear_05", 14, thickness=0.34, spokes=5, mat=mat_copper, location=(x5, y5, z1))

# Gear 6: Meshed with Gear 1 at angle -128 deg (18 teeth, R = 2.16)
alpha_16 = math.radians(-128.0)
r6 = 0.5 * MODULE * 18
d16 = r1 + r6
x6 = x1 + d16 * math.cos(alpha_16)
y6 = y1 + d16 * math.sin(alpha_16)
create_precision_gear("Gear_06", 18, thickness=0.34, spokes=6, mat=mat_dark_steel, location=(x6, y6, z1))

# Gear 7: Deep Background Gear coaxial with Gear 2 (28 teeth, R = 3.36, Z = -0.48)
r7 = 0.5 * MODULE * 28
create_precision_gear("Gear_07_Coaxial2", 28, thickness=0.28, spokes=7, mat=mat_dark_steel, location=(x2, y2, -0.48))

# Gear 8: Deep Background Gear meshed with Gear 7 at angle -155 deg (15 teeth, R = 1.80, Z = -0.48)
alpha_78 = math.radians(-155.0)
r8 = 0.5 * MODULE * 15
d78 = r7 + r8
x8 = x2 + d78 * math.cos(alpha_78)
y8 = y2 + d78 * math.sin(alpha_78)
create_precision_gear("Gear_08_Deep", 15, thickness=0.28, spokes=5, mat=mat_bronze, location=(x8, y8, -0.48))

out_dir = "/home/luciano/Desktop/CRUD-Desafio/frontend/public/models"
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "steampunk_mechanism.glb")

bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format='GLB',
    export_yup=False,
    export_apply=True
)
print("Exported precision interlocking gear train to:", out_path)
