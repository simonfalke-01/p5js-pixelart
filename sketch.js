class pixel {
    constructor(alpha, color, column, row) {
        this.alpha = alpha;
        this.color = color;
        this.column = column;
        this.row = row;
    }

    // returns [[x, y of top left, width, height]
    get_coords(width, height, columns, rows) {
        return [width / columns * this.column, height / rows * this.row, width / columns, height / rows];
    }

    get_color() {
        return this.color;
    }

    get_alpha() {
        return this.alpha;
    }

    in_bounds(width, height, columns, rows, mouseX, mouseY) {
        let top_left = [width / columns * this.column, height / rows * this.row];
        let bottom_right = [width / columns * (this.column + 1), height / rows * (this.row + 1)];

        return top_left[0] < mouseX < bottom_right[0] && top_left[1] < mouseY < bottom_right[1];
    }
}

const which_bound = (width, height, columns, rows, mouseX, mouseY) => {
    return [Math.floor(mouseX / (width / columns)), Math.floor(mouseY / (height / rows))];
}

const create_background = (columns, rows, color_1, color_2) => {
    let background = [];

    for (let i = 0; i < rows; ++i) {
        background.push([]);
        for (let j = 0; j < columns; ++j) {
            let current_color;
            if ((i + j) % 2 === 0) current_color = color_1; else current_color = color_2;

            let current_pixel = new pixel(255, current_color, j, i);
            background[i].push(current_pixel);
        }
    }

    return background;
};

// modified create_background()
const initialize = (columns, rows) => {
    let background = [];

    for (let i = 0; i < rows; ++i) {
        background.push([]);
        for (let j = 0; j < columns; ++j) {
            let current_color = [0, 0, 0];

            let current_pixel = new pixel(0, current_color, j, i);
            background[i].push(current_pixel);
        }
    }

    return background;
};

const link_points = (previous, now) => {
    // previous is the mouse position from the previous frame
    // now is the mouse position from the current frame
    // returns a list of points that are in between the two

    // Bresenham's line algorithm
    let points = [];

    let x1 = previous[0];
    let y1 = previous[1];
    let x2 = now[0];
    let y2 = now[1];

    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);

    let sx = (x1 < x2) ? 2 : -2;
    let sy = (y1 < y2) ? 2 : -2;

    let err = dx - dy;

    while (true) {
        points.push([x1, y1]);

        if (x1 === x2 && y1 === y2) break;

        let e2 = 2 * err;

        if (e2 > -dy) {
            err -= dy;
            x1 += sx;
        }

        if (e2 < dx) {
            err += dx;
            y1 += sy;
        }
    }

    return points;
};

const pixels_to_link_points = (width, height, columns, rows, points) => {
    let pixel_points = [];
    for (let i = 0; i < points.length; ++i) {
        pixel_points.push(which_bound(width, height, columns, rows, ...points[i]));
    }

    // remove duplicates
    let unique_pixel_points = [];
    for (let i = 0; i < pixel_points.length; ++i) {
        if (!unique_pixel_points.includes(pixel_points[i])) {
            unique_pixel_points.push(pixel_points[i]);
        }
    }

    return unique_pixel_points;
}


const WIDTH = 1000;
const HEIGHT = 1000;

const COLUMNS = 50;
const ROWS = 50;

const INFO = [WIDTH, HEIGHT, COLUMNS, ROWS];

const COLOR_1 = [220, 220, 220];
const COLOR_2 = [255, 255, 255];

const BACKGROUND = create_background(COLUMNS, ROWS, COLOR_1, COLOR_2);

let drawn = initialize(COLUMNS, ROWS);

let mode = `draw`;

let _ = new p5(( s ) => {
    const draw_pixels = (pixel_array, info) => {
        let rows = pixel_array.length;
        let columns = pixel_array[0].length;

        for (let i = 0; i < rows; ++i) {
            for (let j = 0; j < columns; ++j) {
                let current_coords = pixel_array[i][j].get_coords(...info);
                let current_alpha = pixel_array[i][j].get_alpha();
                let current_color = s.color(...pixel_array[i][j].get_color());
                current_color.setAlpha(current_alpha);
                s.noStroke();
                s.fill(current_color);
                s.rect(...current_coords);
            }
        }
    };

    const mouse = () => {
        return [s.mouseX, s.mouseY];
    };

    const edit_drawn = (mode, drawn) => {
        if (mode === `draw`) {
            let current_color = [0, 170, 255];
            let current_alpha = 255;
            let current_bound = which_bound(...INFO, ...mouse());
            drawn[current_bound[0]][current_bound[1]] = new pixel(current_alpha, current_color, ...current_bound);
        }

        else if (mode === `erase`) {
            let current_color = [0, 0, 0];
            let current_alpha = 0;
            let current_bound = which_bound(...INFO, ...mouse());
            drawn[current_bound[0]][current_bound[1]] = new pixel(current_alpha, current_color, ...current_bound);
        }

        return drawn;
    }

    s.setup = () => {
        const canvas = s.createCanvas(WIDTH, HEIGHT);
        canvas.style('display', 'block');

        let eraser = s.createButton(`Eraser`);
        eraser.position(0, 0);
        eraser.mousePressed(() => {
            mode = `erase`;
        });

        let pencil = s.createButton(`Pencil`);
        pencil.position(0, 20);
        pencil.mousePressed(() => {
            mode = `draw`;
        });
    };

    s.draw = () => {
        s.background(255);
        draw_pixels(BACKGROUND, INFO);
        draw_pixels(drawn, INFO);
    };

    s.mouseClicked = () => {
        drawn = edit_drawn(mode, drawn);
    }

    s.mouseDragged = () => {
        /*let current_color = [0, 170, 255];
        let current_alpha = 255;
        let current_bound = which_bound(...INFO, ...mouse());
        drawn[current_bound[0]][current_bound[1]] = new pixel(current_alpha, current_color, ...current_bound);

        if (s.pmouseX !== s.mouseX || s.pmouseY !== s.mouseY) {
            let linked_points = pixels_to_link_points(...INFO, link_points([s.pmouseX, s.pmouseY], mouse()));
            for (let i = 0; i < linked_points.length; ++i) {
                drawn[linked_points[i][0]][linked_points[i][1]] = new pixel(current_alpha, current_color, ...linked_points[i]);
            }
        }*/

        drawn = edit_drawn(mode, drawn);

        if (s.pmouseX !== s.mouseX || s.pmouseY !== s.mouseY) {
            let linked_points = pixels_to_link_points(...INFO, link_points([s.pmouseX, s.pmouseY], mouse()));
            for (let i = 0; i < linked_points.length; ++i) {
                drawn[linked_points[i][0]][linked_points[i][1]] = new pixel(current_alpha, current_color, ...linked_points[i]);
            }
        }
    };
});