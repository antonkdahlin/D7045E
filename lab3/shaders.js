const vertexShader = `#version 300 es
precision mediump float;

in vec3 in_position;
in vec3 in_normal;

uniform vec3 u_cameraPosition;
uniform vec3 u_lightPosition;
uniform mat4 u_transform; // worldViewProjection matrix
uniform mat4 u_world; // world matrix

out vec3 surfaceToView;
out vec3 surfaceToLight;
out vec3 normal;


void main(){
    vec3 worldPos  = (u_world * vec4(in_position, 1.0)).xyz;
    
    gl_Position = u_transform * vec4(in_position, 1.0);

    surfaceToLight = u_lightPosition - worldPos;
    surfaceToView = u_cameraPosition - worldPos;

    normal = mat3(u_world) * in_normal;
}
`;

const fragmentShader = `#version 300 es
precision mediump float;

in vec3 surfaceToView;
in vec3 surfaceToLight;
in vec3 normal;

uniform vec3 light_position;
uniform vec4 u_color;
uniform vec3 u_lightColor;

out vec4 fcolor;

void main(){
    vec3 normalDir = normalize(normal);
    vec3 surfaceToLightDir = normalize(surfaceToLight);
    vec3 surfaceToViewDir = normalize(surfaceToView);

    float ambientLight = 0.1;
    vec3 ambient = u_lightColor * ambientLight;

    float diffuseLight = max(dot(normalDir, surfaceToLightDir), 0.0);
    vec3 diffuse = u_lightColor * diffuseLight;
    
    vec3 reflectDir = reflect(-lightDir, norm);  
    vec3 halfVector = normalize(surfaceToLightDir + surfaceToViewDir);
    float shinyness = 30.0;
    float specularLight = 0.0;
    if (diffuseLight > 0.0){
        specularLight = pow(max(dot(normalDir, halfVector), 0.0), shinyness);
    }
    vec3 specular = u_lightColor * specularLight;

    float intensity = 10000.0;
    float distance = length(surfaceToLight);
    float attenuation = intensity / (0.1 + distance*distance);

    fcolor = u_color;
    fcolor.rgb *= (ambient + attenuation * (diffuse + specular));
}
`;